package com.ecommerce.second.dto.responseDTO;

import java.util.List;

public record ApiResponse<T>(
    List<T> products
    , int size 
    , int page 
    , long totalElements
    , int totalPages
    , boolean last
) {
    
}