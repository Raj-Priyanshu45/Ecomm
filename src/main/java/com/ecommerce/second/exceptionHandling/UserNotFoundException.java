package com.ecommerce.second.exceptionHandling;

public class UserNotFoundException extends RuntimeException{
    
    public UserNotFoundException(String mess){
        super(mess);
    }
}