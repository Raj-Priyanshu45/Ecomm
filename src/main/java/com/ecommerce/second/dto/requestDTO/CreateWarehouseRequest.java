package com.ecommerce.second.dto.requestDTO;
 
import com.ecommerce.second.Enum.IndianState;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
 
@Data
public class CreateWarehouseRequest {
 
    @NotBlank(message = "Name is required")
    private String name;
 
    @NotNull(message = "State is required")
    private IndianState state;
 
    @NotBlank(message = "Address is required")
    private String addressLine;
 
    @NotBlank(message = "City is required")
    private String city;
 
    @NotBlank(message = "Pincode is required")
    private String pincode;
 
    private String contactEmail;
    private String contactPhone;
    private int capacityLimit;
}