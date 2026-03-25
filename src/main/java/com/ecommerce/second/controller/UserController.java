package com.ecommerce.second.controller;

import com.ecommerce.second.dto.requestDTO.AddressRequest;
import com.ecommerce.second.dto.responseDTO.AddressResponse;
import com.ecommerce.second.dto.responseDTO.Response;
import com.ecommerce.second.exceptionHandling.AccessDeniedException;
import com.ecommerce.second.model.Address;
import com.ecommerce.second.repo.AddressRepo;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * ──────────────────────────────────────────────────────────────────────────────
 * USER ADDRESS BOOK
 * ──────────────────────────────────────────────────────────────────────────────
 *  GET    /api/users/me/addresses              — list saved addresses
 *  POST   /api/users/me/addresses              — add address
 *  PUT    /api/users/me/addresses/{id}         — update address
 *  DELETE /api/users/me/addresses/{id}         — remove address
 *  PUT    /api/users/me/addresses/{id}/default — set as default
 * ──────────────────────────────────────────────────────────────────────────────
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users/me/addresses")
public class UserController {

    private final AddressRepo addressRepo;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<AddressResponse>> listAddresses(Authentication auth) {
        List<AddressResponse> list = addressRepo.findByKeycloakId(auth.getName())
                .stream().map(this::toResponse).toList();
        return ResponseEntity.ok(list);
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @Transactional
    public ResponseEntity<AddressResponse> addAddress(
            @RequestBody @Valid AddressRequest req,
            Authentication auth) {

        String keycloakId = auth.getName();

        if (req.isDefault()) {
            addressRepo.clearDefaultForUser(keycloakId);
        }

        Address address = addressRepo.save(Address.builder()
                .keycloakId(keycloakId)
                .name(req.getName())
                .addressLine(req.getAddressLine())
                .city(req.getCity())
                .state(req.getState())
                .pincode(req.getPincode())
                .phone(req.getPhone())
                .isDefault(req.isDefault())
                .build());

        return ResponseEntity.status(201).body(toResponse(address));
    }

    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Transactional
    public ResponseEntity<AddressResponse> updateAddress(
            @PathVariable int id,
            @RequestBody @Valid AddressRequest req,
            Authentication auth) {

        String keycloakId = auth.getName();
        Address address = getOwnedAddress(id, keycloakId);

        if (req.isDefault()) {
            addressRepo.clearDefaultForUser(keycloakId);
        }

        address.setName(req.getName());
        address.setAddressLine(req.getAddressLine());
        address.setCity(req.getCity());
        address.setState(req.getState());
        address.setPincode(req.getPincode());
        address.setPhone(req.getPhone());
        address.setDefault(req.isDefault());
        addressRepo.save(address);

        return ResponseEntity.ok(toResponse(address));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Transactional
    public ResponseEntity<Response> deleteAddress(
            @PathVariable int id,
            Authentication auth) {

        Address address = getOwnedAddress(id, auth.getName());
        addressRepo.delete(address);
        return ResponseEntity.ok(new Response("Address deleted"));
    }

    @PutMapping("/{id}/default")
    @PreAuthorize("isAuthenticated()")
    @Transactional
    public ResponseEntity<AddressResponse> setDefault(
            @PathVariable int id,
            Authentication auth) {

        String keycloakId = auth.getName();
        addressRepo.clearDefaultForUser(keycloakId);
        Address address = getOwnedAddress(id, keycloakId);
        address.setDefault(true);
        addressRepo.save(address);
        return ResponseEntity.ok(toResponse(address));
    }

    // ─────────────────────────────────────────────────────────────

    private Address getOwnedAddress(int id, String keycloakId) {
        return addressRepo.findByIdAndKeycloakId(id, keycloakId)
                .orElseThrow(() -> new AccessDeniedException("Address not found or does not belong to you"));
    }

    private AddressResponse toResponse(Address a) {
        return new AddressResponse(
                a.getId(), a.getName(), a.getAddressLine(),
                a.getCity(), a.getState(), a.getPincode(),
                a.getPhone(), a.isDefault()
        );
    }
}