package com.ecommerce.second.dto.responseDTO;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Builder
@Data
public class AddProduct {

    private int productId;

    @NotBlank
    private String name;

    @NotBlank
    private String description;

    @NotBlank
    private String sellerId;

    @NotNull
    private BigDecimal price;

    @NotNull
    private List<String> tags;

    @NotNull
    private int count;

    @NotNull
    private String imageUrl;
}