package com.ecommerce.second.service;

import com.ecommerce.second.dto.requestDTO.AddressRequest;
import com.ecommerce.second.dto.responseDTO.AddressResponse;
import com.ecommerce.second.model.Address;
import com.ecommerce.second.repo.AddressRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AddressService {

    private final AddressRepo addressRepo;

    private String getUserId(Authentication auth) {
        return auth.getName();
    }

    private AddressResponse toResponse(Address a) {
        return new AddressResponse(
                a.getId(),
                a.getName(),
                a.getAddressLine(),
                a.getCity(),
                a.getState(),
                a.getPincode(),
                a.getPhone(),
                a.isDefault()
        );
    }

    public List<AddressResponse> getAddresses(Authentication auth) {
        return addressRepo.findByKeycloakId(getUserId(auth))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public AddressResponse addAddress(AddressRequest req, Authentication auth) {
        String userId = getUserId(auth);

        // If this is the first address, make it default
        boolean isFirst = addressRepo.findByKeycloakId(userId).isEmpty();

        Address address = Address.builder()
                .keycloakId(userId)
                .name(req.getName())
                .addressLine(req.getAddressLine())
                .city(req.getCity())
                .state(req.getState())
                .pincode(req.getPincode())
                .phone(req.getPhone())
                .isDefault(isFirst || req.isDefault())
                .build();

        if (address.isDefault()) {
            clearDefaults(userId);
        }

        return toResponse(addressRepo.save(address));
    }

    public AddressResponse updateAddress(int id, AddressRequest req, Authentication auth) {
        String userId = getUserId(auth);
        Address address = addressRepo.findByIdAndKeycloakId(id, userId)
                .orElseThrow(() -> new RuntimeException("Address not found"));

        address.setName(req.getName());
        address.setAddressLine(req.getAddressLine());
        address.setCity(req.getCity());
        address.setState(req.getState());
        address.setPincode(req.getPincode());
        address.setPhone(req.getPhone());

        return toResponse(addressRepo.save(address));
    }

    public void deleteAddress(int id, Authentication auth) {
        Address address = addressRepo.findByIdAndKeycloakId(id, getUserId(auth))
                .orElseThrow(() -> new RuntimeException("Address not found"));
        addressRepo.delete(address);
    }

    @Transactional
    public void setDefault(int id, Authentication auth) {
        String userId = getUserId(auth);
        Address address = addressRepo.findByIdAndKeycloakId(id, userId)
                .orElseThrow(() -> new RuntimeException("Address not found"));

        addressRepo.clearDefaultForUser(userId);
        address.setDefault(true);
        addressRepo.save(address);
    }

    @Transactional
    private void clearDefaults(String userId) {
        addressRepo.clearDefaultForUser(userId);
    }
}
