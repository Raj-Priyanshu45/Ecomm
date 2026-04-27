package com.ecommerce.second.dto.responseDTO;
import java.math.BigDecimal;
import java.util.List;


public record VariantDetailResponse(
    int variantId,
    String skuCode,
    String key,          
    String value,        
    BigDecimal price,
    boolean availableStock,
    List<String> imageUrls,
    String primaryImageUrl
) {}