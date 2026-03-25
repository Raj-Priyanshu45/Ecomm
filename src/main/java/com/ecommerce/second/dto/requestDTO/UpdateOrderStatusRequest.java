package com.ecommerce.second.dto.requestDTO;
 
import com.ecommerce.second.Enum.OrderStatus;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
 
@Data
public class UpdateOrderStatusRequest {
 
    @NotNull(message = "status is required")
    private OrderStatus status;

}