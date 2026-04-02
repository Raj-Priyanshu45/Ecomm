package com.ecommerce.second.config;

import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;

@Configuration
@OpenAPIDefinition(
    info=@Info(title="My-Api"
        , version="1.0" 
    ),
    security = @SecurityRequirement(name="keycloak")
)
@SecurityScheme(
    name="keycloak",
    type=SecuritySchemeType.HTTP,
    scheme="bearer",
    bearerFormat="JWT"
)
public class SwaggerConfig {
    
}
