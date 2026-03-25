package com.ecommerce.second.dto.requestDTO;
 
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
 
@Data
public class AddToCartRequest {
 
    @NotNull(message = "productId is required")
    private Integer productId;
 
    /** Optional — send null if the product has no variants */
    private Integer variantId;
 
    @NotNull
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;
}