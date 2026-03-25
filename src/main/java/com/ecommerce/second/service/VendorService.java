package com.ecommerce.second.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import com.ecommerce.second.Enum.VendorStatus;
import com.ecommerce.second.dto.requestDTO.CreateWarehouseRequest;
import com.ecommerce.second.dto.requestDTO.VendorApproveRequest;
import com.ecommerce.second.dto.requestDTO.VendorRegistrationRequest;
import com.ecommerce.second.dto.requestDTO.VendorRejectRequest;
import com.ecommerce.second.dto.responseDTO.VendorResponse;
import com.ecommerce.second.dto.responseDTO.WarehouseResponse;
import com.ecommerce.second.exceptionHandling.AccessDeniedException;
import com.ecommerce.second.model.Vendor;
import com.ecommerce.second.model.VendorNotification;
import com.ecommerce.second.model.Warehouse;
import com.ecommerce.second.repo.VendorNotificationRepo;
import com.ecommerce.second.repo.VendorRepo;
import com.ecommerce.second.repo.WarehouseRepo;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class VendorService {

    private final Logger log = LoggerFactory.getLogger(getClass());

    private final VendorRepo vendorRepo;
    private final WarehouseRepo warehouseRepo;
    private final VendorNotificationRepo notificationRepo;

    // ─────────────────────────────────────────────────────────────
    // Warehouse management (ADMIN only)
    // ─────────────────────────────────────────────────────────────

    public WarehouseResponse createWarehouse(CreateWarehouseRequest req) {
        if (warehouseRepo.existsByState(req.getState())) {
            throw new IllegalArgumentException(
                    "A warehouse already exists for state: " + req.getState());
        }
        Warehouse wh = warehouseRepo.save(Warehouse.builder()
                .name(req.getName())
                .state(req.getState())
                .addressLine(req.getAddressLine())
                .city(req.getCity())
                .pincode(req.getPincode())
                .contactEmail(req.getContactEmail())
                .contactPhone(req.getContactPhone())
                .capacityLimit(req.getCapacityLimit())
                .build());
        log.info("Warehouse created: id={}, state={}", wh.getId(), wh.getState());
        return toWarehouseResponse(wh);
    }

    public Page<WarehouseResponse> listWarehouses(int page, int size) {
        return warehouseRepo.findAll(PageRequest.of(page, size, Sort.by("state")))
                .map(this::toWarehouseResponse);
    }

    // ─────────────────────────────────────────────────────────────
    // Vendor registration (authenticated user with VENDOR role)
    // ─────────────────────────────────────────────────────────────

    public VendorResponse registerVendor(VendorRegistrationRequest req, Authentication auth) {
        String keycloakId = auth.getName();

        if (vendorRepo.existsByKeycloakId(keycloakId)) {
            throw new IllegalArgumentException("You have already submitted a vendor application");
        }
       
        Vendor vendor = vendorRepo.save(Vendor.builder()
                .keycloakId(keycloakId)
                .email(req.getEmail())
                .phone(req.getPhone())
                .addressLine(req.getAddressLine())
                .city(req.getCity())
                .state(req.getState())
                .pincode(req.getPincode())
                .status(VendorStatus.PENDING)
                .build());

        log.info("Vendor registered: id={}, keycloakId={}", vendor.getId(), keycloakId);

        // Notify the vendor their application was received
        pushNotification(vendor,
                "Application Received",
                "Your vendor application has been submitted and is under review. We'll notify you once it's processed.",
                String.valueOf(vendor.getId()));

        return toVendorResponse(vendor);
    }

    // ─────────────────────────────────────────────────────────────
    // Admin: list + approve / reject
    // ─────────────────────────────────────────────────────────────

    public Page<VendorResponse> listVendors(VendorStatus status, int page, int size) {
        return vendorRepo.findByStatus(status, PageRequest.of(page, size, Sort.by("registeredAt").descending()))
                .map(this::toVendorResponse);
    }

    public VendorResponse approveVendor(VendorApproveRequest req) {
        Vendor vendor = getVendorById(req.getVendorId());

        if (vendor.getStatus() != VendorStatus.PENDING) {
            throw new IllegalArgumentException("Vendor is not in PENDING status");
        }

        // Resolve warehouse: explicit override OR auto-match by state
        Warehouse warehouse;
        if (req.getWarehouseId() != null) {
            warehouse = warehouseRepo.findById(req.getWarehouseId())
                    .orElseThrow(() -> new IllegalArgumentException("Warehouse not found: " + req.getWarehouseId()));
        } else {
            warehouse = warehouseRepo.findByState(vendor.getState())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "No warehouse exists for state " + vendor.getState() +
                            ". Create one first or specify a warehouseId."));
        }

        vendor.setStatus(VendorStatus.APPROVED);
        vendor.setWarehouse(warehouse);
        vendor.setAdminNote(req.getAdminNote());
        vendorRepo.save(vendor);

        log.info("Vendor approved: id={}, warehouse={}", vendor.getId(), warehouse.getId());

        // Notify the vendor
        pushNotification(vendor,
                "Application Approved 🎉",
                "Congratulations! Your vendor application has been approved. " +
                "You are assigned to the " + warehouse.getName() + " warehouse. " +
                "You can now manage inventory and fulfil orders.",
                String.valueOf(vendor.getId()));

        return toVendorResponse(vendor);
    }

    public VendorResponse rejectVendor(VendorRejectRequest req) {
        Vendor vendor = getVendorById(req.getVendorId());

        if (vendor.getStatus() != VendorStatus.PENDING) {
            throw new IllegalArgumentException("Vendor is not in PENDING status");
        }

        vendor.setStatus(VendorStatus.REJECTED);
        vendor.setAdminNote(req.getAdminNote());
        vendorRepo.save(vendor);

        log.info("Vendor rejected: id={}", vendor.getId());

        pushNotification(vendor,
                "Application Update",
                "Unfortunately, your vendor application has not been approved at this time. " +
                "Reason: " + req.getAdminNote(),
                String.valueOf(vendor.getId()));

        return toVendorResponse(vendor);
    }

    // ─────────────────────────────────────────────────────────────
    // Vendor: get own profile
    // ─────────────────────────────────────────────────────────────

    public VendorResponse getMyProfile(Authentication auth) {
        Vendor vendor = vendorRepo.findByKeycloakId(auth.getName())
                .orElseThrow(() -> new AccessDeniedException("No vendor profile found for this account"));
        return toVendorResponse(vendor);
    }

    // ─────────────────────────────────────────────────────────────
    // Notifications
    // ─────────────────────────────────────────────────────────────

    public void pushNotification(Vendor vendor, String title, String message, String referenceId) {
        notificationRepo.save(VendorNotification.builder()
                .vendor(vendor)
                .title(title)
                .message(message)
                .referenceId(referenceId)
                .build());
    }

    public void markAllNotificationsRead(Authentication auth) {
        Vendor vendor = vendorRepo.findByKeycloakId(auth.getName())
                .orElseThrow(() -> new AccessDeniedException("No vendor profile found"));
        notificationRepo.markAllReadForVendor(vendor.getId());
    }

    // ─────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────

    private Vendor getVendorById(int id) {
        return vendorRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Vendor not found: " + id));
    }

    public VendorResponse toVendorResponse(Vendor v) {
        return new VendorResponse(
                v.getId(),
                v.getKeycloakId(),
                v.getEmail(),
                v.getPhone(),
                v.getAddressLine(),
                v.getCity(),
                v.getState(),
                v.getPincode(),
                v.getStatus(),
                v.getAdminNote(),
                v.getWarehouse() != null ? v.getWarehouse().getId() : null,
                v.getWarehouse() != null ? v.getWarehouse().getName() : null,
                v.getRegisteredAt()
        );
    }

    private WarehouseResponse toWarehouseResponse(Warehouse wh) {
        return new WarehouseResponse(
                wh.getId(), wh.getName(), wh.getState(), wh.getAddressLine(),
                wh.getCity(), wh.getPincode(), wh.getContactEmail(),
                wh.getContactPhone(), wh.getCapacityLimit(), wh.isActive()
        );
    }
}