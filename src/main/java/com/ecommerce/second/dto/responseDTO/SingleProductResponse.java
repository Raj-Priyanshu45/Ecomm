package com.ecommerce.second.dto.responseDTO;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import com.ecommerce.second.model.Tags;


public record SingleProductResponse(
    String name , 
    String description , 
    String sellerId ,
    LocalDateTime addedAt , 
    LocalDateTime modifiedAt ,
    List<Tags> tags,
    List<String> imageUrl,
    Map<String , List<String>> varients
) {
}