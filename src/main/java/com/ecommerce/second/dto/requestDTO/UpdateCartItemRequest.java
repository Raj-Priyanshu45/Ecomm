package com.ecommerce.second.dto.requestDTO;
 
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
 
@Data
public class UpdateCartItemRequest {
 
    @NotNull
    @Min(value = 0, message = "Quantity cannot be negative (use 0 to remove)")
    private Integer quantity;
} 