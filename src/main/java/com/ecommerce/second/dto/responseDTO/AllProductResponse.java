package com.ecommerce.second.dto.responseDTO;

import java.math.BigDecimal;
import java.util.List;

import com.ecommerce.second.model.Tags;


public record AllProductResponse(
    int id , 
    String name , 
    String shortDesc,
    String imageUrl , 
    BigDecimal price ,
    boolean inStock ,
    List<Tags> tags 
    //,double rating
) {
    
}