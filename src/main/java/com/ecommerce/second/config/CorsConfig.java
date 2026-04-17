package com.ecommerce.second.config;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class CorsConfig {

    @Value("${FRONTEND_URL}")
    private String frontendUrl;

    @Value("${EXTRA_CORS_ORIGINS:}")
    private String extraOrigins;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

         List<String> origins = new ArrayList<>();
        origins.add(frontendUrl);
        origins.add("http://localhost:*");
        origins.add("http://127.0.0.1:*");

        // Splits "https://a.com,https://b.com" if you set the env var
        if (!extraOrigins.isBlank()) {
            Arrays.stream(extraOrigins.split(","))
                .map(String::trim)
                .forEach(origins::add);
        }

        config.setAllowedOriginPatterns(origins);

        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));

        config.setAllowedHeaders(List.of(
            "Authorization",
            "Content-Type",
            "Accept",
            "Origin",
            "X-Requested-With"
        ));

        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L); // cache preflight for 1 hour

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}