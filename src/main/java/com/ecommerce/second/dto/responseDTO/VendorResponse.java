package com.ecommerce.second.dto.responseDTO;
 
import java.time.LocalDateTime;

import com.ecommerce.second.Enum.IndianState;
import com.ecommerce.second.Enum.VendorStatus;
 
public record VendorResponse(
        int id,
        String keycloakId,
        String email,
        String phone,
        String addressLine,
        String city,
        IndianState state,
        String pincode,
        VendorStatus status,
        String adminNote,
        Integer warehouseId,
        String warehouseName,
        LocalDateTime registeredAt
) {}