package com.ecommerce.second.dto.responseDTO;
 
import java.math.BigDecimal;
 
public record OrderItemResponse(
        Long orderItemId,
        int productId,
        String productName,
        Integer variantId,
        String skuCode,
        int quantity,
        BigDecimal priceAtOrder,
        BigDecimal lineTotal
) {}