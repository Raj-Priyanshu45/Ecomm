package com.ecommerce.second.dto.requestDTO;
 
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
 
@Data
public class VendorRejectRequest {
 
    @NotNull(message = "vendorId is required")
    private Integer vendorId;
 
    @NotBlank(message = "Rejection reason is required")
    private String adminNote;
}