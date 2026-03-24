package com.ecommerce.second.exceptionHandling;

public class ProductNotFoundException extends RuntimeException{

    public ProductNotFoundException(String mess){
        super(mess);
    }
}