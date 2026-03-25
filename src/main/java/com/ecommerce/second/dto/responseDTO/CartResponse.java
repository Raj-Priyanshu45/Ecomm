package com.ecommerce.second.dto.responseDTO;
 
import java.math.BigDecimal;
import java.util.List;
 
public record CartResponse(
        int cartId,
        List<CartItemResponse> items,
        int totalItemCount,
        BigDecimal totalAmount
) {}