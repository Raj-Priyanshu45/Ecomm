package com.ecommerce.second.dto.responseDTO;

import java.util.List;

public record ChangeImageGETResponse(
     List<ImageDTO> imageList,
     int imageCount, 
     String primary 
) {
    
}