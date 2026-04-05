package com.ecommerce.second.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;

@Configuration
public class CloudinaryConfig {

    @Value("${cloudName}")
    private String cloudName;

    @Value("${api_key}")
    private String api_key;

    @Value("${api_secret}")
    private String api_secret;

    @Bean
    public Cloudinary getCloudinary(){

        return new Cloudinary(
            ObjectUtils.asMap(
                "cloud_name" , cloudName ,
                "api_key" , api_key ,
                "api_secret" , api_secret
            )
        );
    }
}
