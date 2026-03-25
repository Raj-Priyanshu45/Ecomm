package com.ecommerce.second.dto.responseDTO;
 
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.ecommerce.second.Enum.OrderStatus;
 
public record OrderResponse(
        Long orderId,
        OrderStatus status,
        BigDecimal totalAmount,
        String shippingName,
        String shippingAddressLine,
        String shippingCity,
        String shippingState,
        String shippingPincode,
        String shippingPhone,
        Integer warehouseId,
        String warehouseName,
        boolean paymentConfirmed,
        List<OrderItemResponse> items,
        LocalDateTime placedAt,
        LocalDateTime updatedAt,
        LocalDateTime deliveredAt
) {}