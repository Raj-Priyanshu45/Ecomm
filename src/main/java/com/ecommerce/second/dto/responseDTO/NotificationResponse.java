package com.ecommerce.second.dto.responseDTO;
 
import java.time.LocalDateTime;
 
public record NotificationResponse(
        Long id,
        String title,
        String message,
        String referenceId,
        boolean read,
        LocalDateTime createdAt
) {}