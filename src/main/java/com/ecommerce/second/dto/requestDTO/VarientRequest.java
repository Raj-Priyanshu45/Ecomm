package com.ecommerce.second.dto.requestDTO;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VarientRequest {
    
    private String key;
    private String value;
    private BigDecimal price;
    private String imageUrl;
    private int quantity;
}
