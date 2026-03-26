package com.ecommerce.second.controller;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ecommerce.second.Enum.OrderStatus;
import com.ecommerce.second.dto.requestDTO.PlaceOrderRequest;
import com.ecommerce.second.dto.requestDTO.UpdateOrderStatusRequest;
import com.ecommerce.second.dto.responseDTO.OrderResponse;
import com.ecommerce.second.service.OrderService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * ──────────────────────────────────────────────────────────────────────────────
 * ORDER ENDPOINTS
 * ──────────────────────────────────────────────────────────────────────────────
 *
 * Customer
 *  POST   /api/orders                              — checkout
 *  GET    /api/orders                              — list own orders
 *  GET    /api/orders/{orderId}                    — order detail
 *  PUT    /api/orders/{orderId}/cancel             — cancel order
 *  PUT    /api/orders/{orderId}/return             — request return (after delivery)
 *
 * Admin
 *  GET    /api/admin/orders                        — list all orders
 *  PUT    /api/admin/orders/{orderId}/status       — update status (any transition)
 *
 * Vendor
 *  GET    /api/vendor/orders                       — list warehouse orders
 *  PUT    /api/vendor/orders/{orderId}/status      — update status (limited)
 *
 * Support (delivery agent)
 *  PUT    /api/support/orders/{orderId}/status     — shipping + return transitions
 * ──────────────────────────────────────────────────────────────────────────────
 */
@RestController
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    // ── Customer ───────────────────────────────────────────────────

    @PostMapping("/api/orders")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<OrderResponse> placeOrder(
            @RequestBody @Valid PlaceOrderRequest req,
            Authentication auth) {
        return ResponseEntity.status(201).body(orderService.placeOrder(req, auth));
    }

    @GetMapping("/api/orders")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Page<OrderResponse>> myOrders(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication auth) {
        return ResponseEntity.ok(orderService.myOrders(page, size, auth));
    }

    @GetMapping("/api/orders/{orderId}")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('ADMIN') or hasRole('SUPPORT')")
    public ResponseEntity<OrderResponse> getOrder(
            @PathVariable Long orderId,
            Authentication auth) {
        return ResponseEntity.ok(orderService.getOrderDetail(orderId, auth));
    }

    @PutMapping("/api/orders/{orderId}/cancel")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('ADMIN')")
    public ResponseEntity<OrderResponse> cancelOrder(
            @PathVariable Long orderId,
            Authentication auth) {
        return ResponseEntity.ok(orderService.cancelOrder(orderId, auth));
    }

    @PutMapping("/api/orders/{orderId}/return")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<OrderResponse> requestReturn(
            @PathVariable Long orderId,
            Authentication auth) {
        return ResponseEntity.ok(orderService.requestReturn(orderId, auth));
    }

    // ── Admin ──────────────────────────────────────────────────────

    @GetMapping("/api/admin/orders")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<OrderResponse>> listAllOrders(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(orderService.listAllOrders(status, page, size));
    }

    @PutMapping("/api/admin/orders/{orderId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OrderResponse> adminUpdateStatus(
            @PathVariable Long orderId,
            @RequestBody @Valid UpdateOrderStatusRequest req,
            Authentication auth) {
        return ResponseEntity.ok(orderService.updateStatus(orderId, req, auth));
    }

    // ── Vendor (warehouse staff) ───────────────────────────────────

    @GetMapping("/api/vendor/orders")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<Page<OrderResponse>> warehouseOrders(
            @RequestParam int warehouseId,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(orderService.listWarehouseOrders(warehouseId, status, page, size));
    }

    @PutMapping("/api/vendor/orders/{orderId}/status")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<OrderResponse> vendorUpdateStatus(
            @PathVariable Long orderId,
            @RequestBody @Valid UpdateOrderStatusRequest req,
            Authentication auth) {
        return ResponseEntity.ok(orderService.updateStatus(orderId, req, auth));
    }

    // ── Support (delivery agent + return handler) ──────────────────

    @PutMapping("/api/support/orders/{orderId}/status")
    @PreAuthorize("hasRole('SUPPORT')")
    public ResponseEntity<OrderResponse> supportUpdateStatus(
            @PathVariable Long orderId,
            @RequestBody @Valid UpdateOrderStatusRequest req,
            Authentication auth) {
        return ResponseEntity.ok(orderService.updateStatus(orderId, req, auth));
    }
}