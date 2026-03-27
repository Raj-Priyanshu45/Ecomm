package com.ecommerce.second.config;

import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

import org.springframework.context.annotation.Bean;


public class ThreadExecutor {
    
    @Bean("threadExecutor")
    public Executor threadExecutor(){
        return Executors.newVirtualThreadPerTaskExecutor();
    }
}
