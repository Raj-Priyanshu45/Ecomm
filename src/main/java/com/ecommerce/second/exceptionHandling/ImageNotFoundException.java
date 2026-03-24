package com.ecommerce.second.exceptionHandling;

public class ImageNotFoundException extends RuntimeException{

    public ImageNotFoundException(String mess) {
        super(mess);
    }

}