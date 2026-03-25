package com.ecommerce.second.dto.requestDTO;
 
import jakarta.validation.constraints.NotNull;
import lombok.Data;
 
@Data
public class VendorApproveRequest {
 
    @NotNull(message = "vendorId is required")
    private Integer vendorId;
 
    /** Optional override: assign to a specific warehouse. If null, auto-resolved by vendor's state. */
    private Integer warehouseId;
 
    private String adminNote;
}