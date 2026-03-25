package com.ecommerce.second.dto.responseDTO;
 
import java.math.BigDecimal;
 
public record CartItemResponse(
        int cartItemId,
        int productId,
        String productName,
        String productImage,
        Integer variantId,
        String variantLabel,   // e.g. "color: red"
        int quantity,
        BigDecimal priceAtAddition,
        BigDecimal lineTotal
) {}