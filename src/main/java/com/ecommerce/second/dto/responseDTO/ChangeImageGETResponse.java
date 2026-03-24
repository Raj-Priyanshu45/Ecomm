package com.ecommerce.second.dto.responseDTO;

import java.util.List;

public record  ChangeImageGETResponse(
     List<?> imageList,
     int imageCount , 
    String primary 
) {
    
}