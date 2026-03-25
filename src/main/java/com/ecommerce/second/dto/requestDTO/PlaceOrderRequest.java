package com.ecommerce.second.dto.requestDTO;
 
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
 
@Data
public class PlaceOrderRequest {
 
    @NotBlank(message = "Recipient name is required")
    private String shippingName;
 
    @NotBlank(message = "Address is required")
    private String shippingAddressLine;
 
    @NotBlank(message = "City is required")
    private String shippingCity;
 
    @NotBlank(message = "State is required")
    private String shippingState;
 
    @NotBlank(message = "Pincode is required")
    private String shippingPincode;
 
    private String shippingPhone;
}