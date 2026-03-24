package com.ecommerce.second.exceptionHandling;

public class AccessDeniedException extends RuntimeException{
    
    public AccessDeniedException(String mess){
        super(mess);
    }
    
}