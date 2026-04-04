package com.ecommerce.second.dto.responseDTO;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import com.ecommerce.second.model.Tags;


public record SingleProductResponse(
    int id,
    String name, 
    String description, 
    String sellerId,
    BigDecimal price,
    BigDecimal discount,
    Integer count,
    LocalDateTime addedAt, 
    LocalDateTime modifiedAt,
    List<Tags> tags,
    List<String> imageUrl,
    Map<String, List<String>> varients,
    double rating,
    int reviewCount,
    boolean inStock
) {}