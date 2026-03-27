package com.ecommerce.second.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ecommerce.second.Enum.VendorStatus;
import com.ecommerce.second.dto.requestDTO.CreateWarehouseRequest;
import com.ecommerce.second.dto.requestDTO.VendorApproveRequest;
import com.ecommerce.second.dto.requestDTO.VendorRegistrationRequest;
import com.ecommerce.second.dto.requestDTO.VendorRejectRequest;
import com.ecommerce.second.dto.responseDTO.NotificationResponse;
import com.ecommerce.second.dto.responseDTO.VendorResponse;
import com.ecommerce.second.dto.responseDTO.WarehouseResponse;
import com.ecommerce.second.model.VendorNotification;
import com.ecommerce.second.repo.VendorNotificationRepo;
import com.ecommerce.second.repo.VendorRepo;
import com.ecommerce.second.service.VendorService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * ──────────────────────────────────────────────────────────────────────────────
 * VENDOR & WAREHOUSE ENDPOINTS
 * ──────────────────────────────────────────────────────────────────────────────
 *
 * Warehouse (ADMIN)
 *  POST   /api/admin/warehouses              — create warehouse for a state
 *  GET    /api/admin/warehouses              — list all warehouses
 *
 * Vendor registration (VENDOR role in Keycloak)
 *  POST   /api/vendor/register              — submit registration
 *  GET    /api/vendor/me                    — get own profile
 *  GET    /api/vendor/notifications         — list notifications (popup feed)
 *  PUT    /api/vendor/notifications/read    — mark all notifications as read
 *
 * Admin: approve / reject vendors
 *  GET    /api/admin/vendors                — list vendors by status
 *  POST   /api/admin/vendors/approve        — approve + assign warehouse
 *  POST   /api/admin/vendors/reject         — reject with reason
 * ──────────────────────────────────────────────────────────────────────────────
 */
@RestController
@RequiredArgsConstructor
public class VendorController {

    private final VendorService vendorService;
    private final VendorRepo vendorRepo;
    private final VendorNotificationRepo notificationRepo;

    // ── Warehouse ──────────────────────────────────────────────────

    @PostMapping("/api/admin/warehouses")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<WarehouseResponse> createWarehouse(
            @RequestBody @Valid CreateWarehouseRequest req) {
        return ResponseEntity.status(201).body(vendorService.createWarehouse(req));
    }

    @GetMapping("/api/admin/warehouses")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<WarehouseResponse>> listWarehouses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(vendorService.listWarehouses(page, size));
    }

    // ── Vendor registration ────────────────────────────────────────

    @PostMapping("/api/vendor/register")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<VendorResponse> register(
            @RequestBody @Valid VendorRegistrationRequest req,
            Authentication auth) {
        return ResponseEntity.status(201).body(vendorService.registerVendor(req, auth));
    }

    @GetMapping("/api/vendor/me")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<VendorResponse> myProfile(Authentication auth) {
        return ResponseEntity.ok(vendorService.getMyProfile(auth));
    }

    // ── Vendor notifications (the popup feed) ─────────────────────

    @GetMapping("/api/vendor/notifications")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<Page<NotificationResponse>> getNotifications(
            @RequestParam(defaultValue = "false") boolean unreadOnly,
            @RequestParam(defaultValue = "0")     int page,
            @RequestParam(defaultValue = "20")    int size,
            Authentication auth) {

        var vendor = vendorRepo.findByKeycloakId(auth.getName())
                .orElseThrow(() -> new IllegalStateException("No vendor profile found"));

        Page<VendorNotification> result = unreadOnly
                ? notificationRepo.findByVendorIdAndReadFalseOrderByCreatedAtDesc(
                        vendor.getId(), PageRequest.of(page, size))
                : notificationRepo.findByVendorIdOrderByCreatedAtDesc(
                        vendor.getId(), PageRequest.of(page, size));

        return ResponseEntity.ok(result.map(n -> new NotificationResponse(
                n.getId(), n.getTitle(), n.getMessage(),
                n.getReferenceId(), n.isRead(), n.getCreatedAt())));
    }

    @PutMapping("/api/vendor/notifications/read")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<Void> markAllRead(Authentication auth) {
        vendorService.markAllNotificationsRead(auth);
        return ResponseEntity.noContent().build();
    }

    // ── Admin: manage vendors ──────────────────────────────────────

    @GetMapping("/api/admin/vendors")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<VendorResponse>> listVendors(
            @RequestParam(defaultValue = "PENDING") VendorStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(vendorService.listVendors(status, page, size));
    }

    @PostMapping("/api/admin/vendors/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<VendorResponse> approveVendor(
            @RequestBody @Valid VendorApproveRequest req) {
        return ResponseEntity.ok(vendorService.approveVendor(req));
    }

    @PostMapping("/api/admin/vendors/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<VendorResponse> rejectVendor(
            @RequestBody @Valid VendorRejectRequest req) {
        return ResponseEntity.ok(vendorService.rejectVendor(req));
    }
}


