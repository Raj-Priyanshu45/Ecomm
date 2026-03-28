package com.ecommerce.second.dto.responseDTO;

import java.math.BigDecimal;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VariantResponse {
    private int id;
    private String key;
    private String value;
    private BigDecimal price;
    private int quantity;
    private String skuCode;
    private List<VariantImageResponse> images;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VariantImageResponse {
        private int id;
        private String imageUrl;
        private boolean primary;
    }
}
