package com.ecommerce.second.config;

import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ThreadExecutor {
    
    @Bean
    public Executor threadExecutor(){
        return Executors.newVirtualThreadPerTaskExecutor();
    }
}
