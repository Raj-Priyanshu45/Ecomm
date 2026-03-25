package com.ecommerce.second.dto.requestDTO;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VarientRequest {

    @NotBlank(message = "Variant key is required (e.g. 'color', 'size')")
    private String key;

    @NotBlank(message = "Variant value is required (e.g. 'red', 'XL')")
    private String value;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    private BigDecimal price;

    private String imageUrl;

    @Min(value = 0, message = "Quantity cannot be negative")
    private int quantity;
}