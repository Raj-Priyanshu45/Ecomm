package com.ecommerce.second.service;

import java.time.LocalDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import com.ecommerce.second.Enum.IndianState;
import com.ecommerce.second.Enum.OrderStatus;
import com.ecommerce.second.dto.requestDTO.PlaceOrderRequest;
import com.ecommerce.second.dto.requestDTO.UpdateOrderStatusRequest;
import com.ecommerce.second.dto.responseDTO.OrderItemResponse;
import com.ecommerce.second.dto.responseDTO.OrderResponse;
import com.ecommerce.second.exceptionHandling.AccessDeniedException;
import com.ecommerce.second.model.Cart;
import com.ecommerce.second.model.CartItem;
import com.ecommerce.second.model.Order;
import com.ecommerce.second.model.OrderItem;
import com.ecommerce.second.model.Vendor;
import com.ecommerce.second.model.VendorNotification;
import com.ecommerce.second.model.Warehouse;
import com.ecommerce.second.repo.InventoryRepo;
import com.ecommerce.second.repo.OrderItemRepo;
import com.ecommerce.second.repo.OrderRepo;
import com.ecommerce.second.repo.VendorNotificationRepo;
import com.ecommerce.second.repo.VendorRepo;
import com.ecommerce.second.repo.WarehouseRepo;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class OrderService {

    private final Logger log = LoggerFactory.getLogger(getClass());

    private final OrderRepo orderRepo;
    private final OrderItemRepo orderItemRepo;
    private final InventoryRepo inventoryRepo;
    private final WarehouseRepo warehouseRepo;
    private final VendorRepo vendorRepo;
    private final VendorNotificationRepo notificationRepo;
    private final CartService cartService;

    // ─────────────────────────────────────────────────────────────
    // Place order (Customer)
    // ─────────────────────────────────────────────────────────────

    public OrderResponse placeOrder(PlaceOrderRequest req, Authentication auth) {
        String keycloakId = auth.getName();

        Cart cart = cartService.getCartForCheckout(keycloakId);
        Warehouse warehouse = resolveWarehouse(req.getShippingState());

        Order order = orderRepo.save(Order.builder()
                .keycloakId(keycloakId)
                .status(OrderStatus.PLACED)
                .totalAmount(cart.totalAmount())
                .shippingName(req.getShippingName())
                .shippingAddressLine(req.getShippingAddressLine())
                .shippingCity(req.getShippingCity())
                .shippingState(req.getShippingState())
                .shippingPincode(req.getShippingPincode())
                .shippingPhone(req.getShippingPhone())
                .warehouse(warehouse)
                .build());

        for (CartItem ci : cart.getItems()) {
            String skuCode = ci.getVariant() != null ? ci.getVariant().getSkuCode() : null;
            if (skuCode != null) {
                deductInventory(skuCode, ci.getQuantity());
            }
            orderItemRepo.save(OrderItem.builder()
                    .order(order)
                    .product(ci.getProduct())
                    .variant(ci.getVariant())
                    .quantity(ci.getQuantity())
                    .priceAtOrder(ci.getPriceAtAddition())
                    .sellerKeycloakId(ci.getProduct().getSeller().getKeyCloakId())
                    .skuCode(skuCode)
                    .build());
        }

        cartService.clearCartById(cart.getId());
        log.info("Order placed: id={}, keycloakId={}", order.getId(), keycloakId);
        notifyWarehouseVendors(warehouse, order);

        return toOrderResponse(orderRepo.findById(order.getId()).orElseThrow());
    }

    // ─────────────────────────────────────────────────────────────
    // Update order status (ADMIN / VENDOR / SUPPORT)
    // ─────────────────────────────────────────────────────────────

    public OrderResponse updateStatus(Long orderId, UpdateOrderStatusRequest req, Authentication auth) {
        Order order = getOrder(orderId);
        validateStatusTransition(order.getStatus(), req.getStatus(), auth);

        order.setStatus(req.getStatus());

        if (req.getStatus() == OrderStatus.ARRIVED || req.getStatus() == OrderStatus.DELIVERED) {
            order.setDeliveredAt(LocalDateTime.now());
        }

        // When refund is issued, restore inventory
        if (req.getStatus() == OrderStatus.REFUNDED) {
            for (OrderItem item : order.getItems()) {
                if (item.getSkuCode() != null) {
                    restoreInventory(item.getSkuCode(), item.getQuantity());
                }
            }
        }

        orderRepo.save(order);
        log.info("Order status updated: id={}, status={}", orderId, req.getStatus());
        return toOrderResponse(order);
    }

    // ─────────────────────────────────────────────────────────────
    // Customer: request return
    // ─────────────────────────────────────────────────────────────

    public OrderResponse requestReturn(Long orderId, Authentication auth) {
        Order order = getOrder(orderId);

        if (!order.getKeycloakId().equals(auth.getName())) {
            throw new AccessDeniedException("You cannot request a return for this order");
        }

        if (order.getStatus() != OrderStatus.ARRIVED && order.getStatus() != OrderStatus.DELIVERED) {
            throw new IllegalStateException(
                    "Return can only be requested for orders with status ARRIVED or DELIVERED. " +
                    "Current status: " + order.getStatus());
        }

        order.setStatus(OrderStatus.RETURN_REQUESTED);
        orderRepo.save(order);
        log.info("Return requested: orderId={}, keycloakId={}", orderId, auth.getName());

        return toOrderResponse(order);
    }

    // ─────────────────────────────────────────────────────────────
    // Customer: cancel order
    // ─────────────────────────────────────────────────────────────

    public OrderResponse cancelOrder(Long orderId, Authentication auth) {
        Order order = getOrder(orderId);

        if (!order.getKeycloakId().equals(auth.getName()) && !hasRole(auth, "ADMIN")) {
            throw new AccessDeniedException("You cannot cancel this order");
        }

        if (order.getStatus() == OrderStatus.SHIPPED
                || order.getStatus() == OrderStatus.OUT_FOR_DELIVERY
                || order.getStatus() == OrderStatus.ARRIVED
                || order.getStatus() == OrderStatus.DELIVERED) {
            throw new IllegalStateException("Order cannot be cancelled once shipped. Please use return instead.");
        }

        for (OrderItem item : order.getItems()) {
            if (item.getSkuCode() != null) {
                restoreInventory(item.getSkuCode(), item.getQuantity());
            }
        }

        order.setStatus(OrderStatus.CANCELLED);
        orderRepo.save(order);
        log.info("Order cancelled: id={}", orderId);

        return toOrderResponse(order);
    }

    // ─────────────────────────────────────────────────────────────
    // Customer: view own orders
    // ─────────────────────────────────────────────────────────────

    public Page<OrderResponse> myOrders(int page, int size, Authentication auth) {
        return orderRepo.findByKeycloakIdOrderByPlacedAtDesc(
                auth.getName(), PageRequest.of(page, size))
                .map(this::toOrderResponse);
    }

    public OrderResponse getOrderDetail(Long orderId, Authentication auth) {
        Order order = getOrder(orderId);
        boolean isOwner   = order.getKeycloakId().equals(auth.getName());
        boolean isAdmin   = hasRole(auth, "ADMIN");
        boolean isSupport = hasRole(auth, "SUPPORT");

        if (!isOwner && !isAdmin && !isSupport) {
            throw new AccessDeniedException("You are not allowed to view this order");
        }
        return toOrderResponse(order);
    }

    // ─────────────────────────────────────────────────────────────
    // Admin: list all orders
    // ─────────────────────────────────────────────────────────────

    public Page<OrderResponse> listAllOrders(OrderStatus status, int page, int size) {
        if (status != null) {
            return orderRepo.findByStatusOrderByPlacedAtDesc(
                    status, PageRequest.of(page, size)).map(this::toOrderResponse);
        }
        return orderRepo.findAll(PageRequest.of(page, size,
                Sort.by("placedAt").descending())).map(this::toOrderResponse);
    }

    // ─────────────────────────────────────────────────────────────
    // Vendor: list warehouse orders
    // ─────────────────────────────────────────────────────────────

    public Page<OrderResponse> listWarehouseOrders(int warehouseId, OrderStatus status,
            int page, int size) {
        if (status != null) {
            return orderRepo.findByWarehouseIdAndStatusOrderByPlacedAtDesc(
                    warehouseId, status, PageRequest.of(page, size)).map(this::toOrderResponse);
        }
        return orderRepo.findByWarehouseIdOrderByPlacedAtDesc(
                warehouseId, PageRequest.of(page, size)).map(this::toOrderResponse);
    }

    // ─────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────

    private Order getOrder(Long orderId) {
        return orderRepo.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));
    }

    private Warehouse resolveWarehouse(String shippingState) {
        try {
            IndianState state = IndianState.valueOf(
                    shippingState.trim().toUpperCase().replace(" ", "_"));
            return warehouseRepo.findByState(state)
                    .orElseGet(() -> warehouseRepo.findAll().stream()
                            .filter(Warehouse::isActive)
                            .findFirst()
                            .orElseThrow(() -> new IllegalStateException(
                                    "No active warehouse found. Please contact support.")));
        } catch (IllegalArgumentException e) {
            return warehouseRepo.findAll().stream()
                    .filter(Warehouse::isActive)
                    .findFirst()
                    .orElseThrow(() -> new IllegalStateException("No active warehouse found"));
        }
    }

    private void deductInventory(String skuCode, int qty) {
        inventoryRepo.findBySkuCode(skuCode).ifPresent(inv -> {
            inv.setAvailable(Math.max(0, inv.getAvailable() - qty));
            inv.setReserved(inv.getReserved() + qty);
            inventoryRepo.save(inv);
        });
    }

    private void restoreInventory(String skuCode, int qty) {
        inventoryRepo.findBySkuCode(skuCode).ifPresent(inv -> {
            inv.setAvailable(inv.getAvailable() + qty);
            inv.setReserved(Math.max(0, inv.getReserved() - qty));
            inventoryRepo.save(inv);
        });
    }

    private void notifyWarehouseVendors(Warehouse warehouse, Order order) {
        List<Vendor> vendors = vendorRepo.findAll().stream()
                .filter(v -> v.getWarehouse() != null
                        && v.getWarehouse().getId() == warehouse.getId())
                .toList();

        for (Vendor vendor : vendors) {
            notificationRepo.save(VendorNotification.builder()
                    .vendor(vendor)
                    .title("New Order Arrived")
                    .message("Order #" + order.getId() + " placed for your warehouse ("
                            + warehouse.getName() + "). Total: ₹" + order.getTotalAmount()
                            + ". Please confirm and pack.")
                    .referenceId(String.valueOf(order.getId()))
                    .build());
        }
        log.info("Notified {} vendor(s) for warehouseId={}", vendors.size(), warehouse.getId());
    }

    /**
     * Status transition guard.
     * ADMIN can do anything.
     * VENDOR:   PAYMENT_CONFIRMED → CONFIRMED → PACKED → SHIPPED
     * SUPPORT:  SHIPPED → OUT_FOR_DELIVERY → ARRIVED | DELIVERY_FAILED
     *           RETURN_REQUESTED → RETURN_PICKED_UP → REFUNDED
     */
    private void validateStatusTransition(OrderStatus current, OrderStatus next, Authentication auth) {
        if (hasRole(auth, "ADMIN")) return;

        if (hasRole(auth, "VENDOR")) {
            boolean allowed = switch (current) {
                case PAYMENT_CONFIRMED -> next == OrderStatus.CONFIRMED;
                case CONFIRMED         -> next == OrderStatus.PACKED;
                case PACKED            -> next == OrderStatus.SHIPPED;
                default -> false;
            };
            if (!allowed) throw new AccessDeniedException(
                    "Vendors may only transition: PAYMENT_CONFIRMED→CONFIRMED→PACKED→SHIPPED");
        }

        if (hasRole(auth, "SUPPORT")) {
            boolean allowed = switch (current) {
                case SHIPPED             -> next == OrderStatus.OUT_FOR_DELIVERY;
                case OUT_FOR_DELIVERY    -> next == OrderStatus.ARRIVED || next == OrderStatus.DELIVERY_FAILED;
                case RETURN_REQUESTED    -> next == OrderStatus.RETURN_PICKED_UP;
                case RETURN_PICKED_UP    -> next == OrderStatus.REFUNDED;
                default -> false;
            };
            if (!allowed) throw new AccessDeniedException(
                    "Invalid status transition for SUPPORT role");
        }
    }

    private boolean hasRole(Authentication auth, String role) {
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_" + role.toUpperCase()));
    }

    // ─────────────────────────────────────────────────────────────
    // Mapping
    // ─────────────────────────────────────────────────────────────

    private OrderResponse toOrderResponse(Order order) {
        List<OrderItemResponse> items = order.getItems().stream()
                .map(oi -> new OrderItemResponse(
                        oi.getId(),
                        oi.getProduct().getId(),
                        oi.getProduct().getName(),
                        oi.getVariant() != null ? oi.getVariant().getId() : null,
                        oi.getSkuCode(),
                        oi.getQuantity(),
                        oi.getPriceAtOrder(),
                        oi.lineTotal()
                ))
                .toList();

        return new OrderResponse(
                order.getId(),
                order.getStatus(),
                order.getTotalAmount(),
                order.getShippingName(),
                order.getShippingAddressLine(),
                order.getShippingCity(),
                order.getShippingState(),
                order.getShippingPincode(),
                order.getShippingPhone(),
                order.getWarehouse() != null ? order.getWarehouse().getId() : null,
                order.getWarehouse() != null ? order.getWarehouse().getName() : null,
                order.isPaymentConfirmed(),
                items,
                order.getPlacedAt(),
                order.getUpdatedAt(),
                order.getDeliveredAt()
        );
    }
}