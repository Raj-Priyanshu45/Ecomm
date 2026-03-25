package com.ecommerce.second.service;

import com.ecommerce.second.Enum.IndianState;
import com.ecommerce.second.Enum.OrderStatus;
import com.ecommerce.second.dto.requestDTO.PlaceOrderRequest;
import com.ecommerce.second.dto.requestDTO.UpdateOrderStatusRequest;
import com.ecommerce.second.dto.responseDTO.OrderItemResponse;
import com.ecommerce.second.dto.responseDTO.OrderResponse;
import com.ecommerce.second.exceptionHandling.AccessDeniedException;
import com.ecommerce.second.model.*;
import com.ecommerce.second.repo.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

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

        // 1. Grab and validate the cart
        Cart cart = cartService.getCartForCheckout(keycloakId);

        // 2. Resolve warehouse from shipping state
        Warehouse warehouse = resolveWarehouse(req.getShippingState());

        // 3. Build Order
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

        // 4. Convert cart items → order items + deduct inventory
        for (CartItem ci : cart.getItems()) {
            String skuCode = ci.getVariant() != null
                    ? ci.getVariant().getSkuCode()
                    : null;

            // Inventory deduction (only for variants with SKU)
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

        // 5. Clear cart
        cartService.clearCartById(cart.getId());

        log.info("Order placed: id={}, keycloakId={}, warehouse={}", order.getId(), keycloakId, warehouse.getId());

        // 6. Notify all vendors assigned to this warehouse
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

        orderRepo.save(order);
        log.info("Order status updated: id={}, status={}", orderId, req.getStatus());

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
    // Admin / Vendor: list orders
    // ─────────────────────────────────────────────────────────────

    public Page<OrderResponse> listAllOrders(OrderStatus status, int page, int size) {
        if (status != null) {
            return orderRepo.findByStatusOrderByPlacedAtDesc(
                    status, PageRequest.of(page, size)).map(this::toOrderResponse);
        }
        return orderRepo.findAll(PageRequest.of(page, size,
                Sort.by("placedAt").descending())).map(this::toOrderResponse);
    }

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
    // Customer: cancel order
    // ─────────────────────────────────────────────────────────────

    public OrderResponse cancelOrder(Long orderId, Authentication auth) {
        Order order = getOrder(orderId);

        if (!order.getKeycloakId().equals(auth.getName()) && !hasRole(auth, "ADMIN")) {
            throw new AccessDeniedException("You cannot cancel this order");
        }

        if (order.getStatus() == OrderStatus.SHIPPED
                || order.getStatus() == OrderStatus.OUT_FOR_DELIVERY
                || order.getStatus() == OrderStatus.ARRIVED) {
            throw new IllegalStateException("Order cannot be cancelled once shipped");
        }

        // Restore inventory
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
    // Private helpers
    // ─────────────────────────────────────────────────────────────

    private Order getOrder(Long orderId) {
        return orderRepo.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));
    }

    /**
     * Resolve warehouse by matching the shipping state string to IndianState enum.
     * Falls back to a default warehouse if the specific state has none.
     */
    private Warehouse resolveWarehouse(String shippingState) {
        try {
            IndianState state = IndianState.valueOf(
                    shippingState.trim().toUpperCase().replace(" ", "_"));
            return warehouseRepo.findByState(state)
                    .orElseGet(() -> warehouseRepo.findAll()
                            .stream()
                            .filter(Warehouse::isActive)
                            .findFirst()
                            .orElseThrow(() -> new IllegalStateException(
                                    "No active warehouse found. Please contact support.")));
        } catch (IllegalArgumentException e) {
            // Could not parse state — use any active warehouse
            return warehouseRepo.findAll()
                    .stream()
                    .filter(Warehouse::isActive)
                    .findFirst()
                    .orElseThrow(() -> new IllegalStateException("No active warehouse found"));
        }
    }

    private void deductInventory(String skuCode, int qty) {
        inventoryRepo.findBySkuCode(skuCode).ifPresent(inv -> {
            int newAvailable = Math.max(0, inv.getAvailable() - qty);
            inv.setAvailable(newAvailable);
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

    /**
     * Push a notification to every approved vendor whose warehouse matches the order's warehouse.
     */
    private void notifyWarehouseVendors(Warehouse warehouse, Order order) {
        List<Vendor> vendors = vendorRepo.findAll().stream()
                .filter(v -> v.getWarehouse() != null
                        && v.getWarehouse().getId() == warehouse.getId())
                .toList();

        for (Vendor vendor : vendors) {
            notificationRepo.save(VendorNotification.builder()
                    .vendor(vendor)
                    .title("New Order Arrived")
                    .message("Order #" + order.getId() + " has been placed and assigned to your warehouse ("
                            + warehouse.getName() + "). Total: ₹" + order.getTotalAmount()
                            + ". Please confirm and pack the order.")
                    .referenceId(String.valueOf(order.getId()))
                    .build());
        }

        log.info("Notified {} vendor(s) for warehouseId={}", vendors.size(), warehouse.getId());
    }

    /**
     * Basic status transition guard.
     * Admin can do anything; vendors / support follow a controlled flow.
     */
    private void validateStatusTransition(OrderStatus current, OrderStatus next, Authentication auth) {
        if (hasRole(auth, "ADMIN")) return; // admins bypass transition checks

        // Vendors can only move: CONFIRMED → PACKED → SHIPPED
        if (hasRole(auth, "VENDOR")) {
            boolean vendorAllowed = switch (current) {
                case PAYMENT_CONFIRMED -> next == OrderStatus.CONFIRMED;
                case CONFIRMED         -> next == OrderStatus.PACKED;
                case PACKED            -> next == OrderStatus.SHIPPED;
                default -> false;
            };
            if (!vendorAllowed) {
                throw new AccessDeniedException(
                        "Vendors can only transition: PAYMENT_CONFIRMED→CONFIRMED→PACKED→SHIPPED");
            }
        }

        // Delivery agents (SUPPORT) can mark: SHIPPED → OUT_FOR_DELIVERY → ARRIVED | DELIVERY_FAILED
        if (hasRole(auth, "SUPPORT")) {
            boolean supportAllowed = switch (current) {
                case SHIPPED           -> next == OrderStatus.OUT_FOR_DELIVERY;
                case OUT_FOR_DELIVERY  -> next == OrderStatus.ARRIVED || next == OrderStatus.DELIVERY_FAILED;
                default -> false;
            };
            if (!supportAllowed) {
                throw new AccessDeniedException(
                        "Support can only transition: SHIPPED→OUT_FOR_DELIVERY→ARRIVED|DELIVERY_FAILED");
            }
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