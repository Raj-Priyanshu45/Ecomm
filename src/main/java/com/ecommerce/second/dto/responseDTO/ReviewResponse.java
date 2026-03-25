package com.ecommerce.second.dto.responseDTO;

public record ReviewResponse(
        Long reviewId,
        int rating,
        String comment,
        String reviewerKeycloakId
) {}