package com.ecommerce.second.config;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfigurationSource;

import lombok.RequiredArgsConstructor;

@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final CorsConfigurationSource corsConfigurationSource;

    private final String[] freeUrl = {
        "/api/browse/**",
        "/uploads/**"
    };

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
            // CORS must come BEFORE csrf/auth so OPTIONS preflight is handled correctly
            .cors(cors -> cors.configurationSource(corsConfigurationSource))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth ->
                auth.requestMatchers(freeUrl).permitAll()
                    .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth -> oauth
                .jwt(jwt -> jwt
                    .jwtAuthenticationConverter(jwtAuthenticationConverter())
                )
            )
            .build();
    }

    @SuppressWarnings("unchecked")
    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();

        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            List<String> allRoles = new java.util.ArrayList<>();

            // 1) Extract client roles from resource_access (Keycloak client-level roles)
            Map<String, Object> resourceAccess = jwt.getClaim("resource_access");
            if (resourceAccess != null) {
                // Check "back-end" client roles
                Map<String, Object> backendAccess = (Map<String, Object>) resourceAccess.get("back-end");
                if (backendAccess != null && backendAccess.get("roles") != null) {
                    allRoles.addAll((List<String>) backendAccess.get("roles"));
                }
                // Also check "angular-client" client roles
                Map<String, Object> angularAccess = (Map<String, Object>) resourceAccess.get("angular-client");
                if (angularAccess != null && angularAccess.get("roles") != null) {
                    allRoles.addAll((List<String>) angularAccess.get("roles"));
                }
            }

            // 2) Fallback: also include realm_access roles
            Map<String, Object> realmAccess = jwt.getClaim("realm_access");
            if (realmAccess != null && realmAccess.get("roles") != null) {
                allRoles.addAll((List<String>) realmAccess.get("roles"));
            }

            if (allRoles.isEmpty()) {
                return Collections.emptyList();
            }

            return allRoles.stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))
                .distinct()
                .collect(Collectors.toList());
        });

        return converter;
    }
}