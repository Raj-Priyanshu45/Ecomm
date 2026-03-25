package com.ecommerce.second.dto.requestDTO;
 
import com.ecommerce.second.Enum.IndianState;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
 
@Data
public class VendorRegistrationRequest {
 
    @NotBlank(message = "Business name is required")
    private String businessName;
 
    @NotBlank(message = "Email is required")
    private String email;
 
    private String phone;
 
    @NotBlank(message = "Address is required")
    private String addressLine;
 
    @NotBlank(message = "City is required")
    private String city;
 
    @NotNull(message = "State is required")
    private IndianState state;
 
    @NotBlank(message = "Pincode is required")
    private String pincode;
}