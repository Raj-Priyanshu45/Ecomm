package com.ecommerce.second.dto.responseDTO;

public record AddressResponse(
        int id,
        String name,
        String addressLine,
        String city,
        String state,
        String pincode,
        String phone,
        boolean isDefault
) {}