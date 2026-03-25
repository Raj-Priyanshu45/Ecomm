package com.ecommerce.second.dto.responseDTO;
 
import com.ecommerce.second.Enum.IndianState;
 
public record WarehouseResponse(
        int id,
        String name,
        IndianState state,
        String addressLine,
        String city,
        String pincode,
        String contactEmail,
        String contactPhone,
        int capacityLimit,
        boolean active
) {}