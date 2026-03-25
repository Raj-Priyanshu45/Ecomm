package com.ecommerce.second.controller;

import com.ecommerce.second.Enum.Role;
import com.ecommerce.second.dto.responseDTO.Response;
import com.ecommerce.second.model.User;
import com.ecommerce.second.repo.UserRepo;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * ──────────────────────────────────────────────────────────────────────────────
 * AUTH / USER SYNC ENDPOINTS
 * ──────────────────────────────────────────────────────────────────────────────
 *
 *  POST  /api/auth/register    — called by frontend on first login.
 *                                Reads the JWT, extracts sub + email + roles,
 *                                and creates the User row if it doesn't exist.
 *                                Idempotent — safe to call every login.
 *
 *  GET   /api/auth/me          — returns the synced User record for the caller.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * HOW TO USE FROM FRONTEND
 * ──────────────────────────────────────────────────────────────────────────────
 *  After Keycloak redirects back with a token, call:
 *
 *    POST /api/auth/register
 *    Authorization: Bearer <access_token>
 *
 *  That's it. No request body needed — everything comes from the JWT.
 *  The response tells you whether a new account was created or it already existed.
 * ──────────────────────────────────────────────────────────────────────────────
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthController {

    private final Logger log = LoggerFactory.getLogger(getClass());
    private final UserRepo userRepo;

    /**
     * POST /api/auth/register
     *
     * Syncs the Keycloak user into the local User table.
     * - Reads keycloakId (sub), email, and roles from the JWT automatically.
     * - If the user already exists → returns 200 OK (idempotent).
     * - If the user is new → creates the record and returns 201 Created.
     *
     * Role resolution priority:
     *   1. ADMIN  (highest)
     *   2. SELLER
     *   3. VENDOR
     *   4. SUPPORT
     *   5. CUSTOMER (default / fallback)
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(Authentication authentication) {

        String keycloakId = authentication.getName();

        // Check if already synced
        if (userRepo.findByKeyCloakId(keycloakId).isPresent()) {
            log.debug("User already synced: keycloakId={}", keycloakId);
            return ResponseEntity.ok(new Response("Already registered — welcome back!"));
        }

        // Extract email from JWT claims
        String email = extractEmail(authentication);

        // Resolve the primary role from Keycloak roles
        Role role = resolveRole(authentication);

        User user = userRepo.save(User.builder()
                .keyCloakId(keycloakId)
                .email(email)
                .role(role)
                .build());

        log.info("New user synced from Keycloak: id={}, keycloakId={}, role={}", user.getId(), keycloakId, role);

        return ResponseEntity.status(201).body(
                Map.of(
                        "message",     "User registered successfully",
                        "userId",      user.getId(),
                        "keycloakId",  keycloakId,
                        "email",       email != null ? email : "",
                        "role",        role.name()
                )
        );
    }

    /**
     * GET /api/auth/me
     *
     * Returns the current user's DB record.
     * Useful for the frontend to get the internal userId and role.
     */
    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {
        String keycloakId = authentication.getName();

        User user = userRepo.findByKeyCloakId(keycloakId)
                .orElse(null);

        if (user == null) {
            // User hasn't called /register yet
            return ResponseEntity.status(404).body(
                    new Response("User not synced yet. Please call POST /api/auth/register first.")
            );
        }

        return ResponseEntity.ok(Map.of(
                "userId",     user.getId(),
                "keycloakId", user.getKeyCloakId(),
                "email",      user.getEmail() != null ? user.getEmail() : "",
                "role",       user.getRole().name()
        ));
    }

    // ─────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────

    /**
     * Pulls the email claim from the JWT.
     * Keycloak puts it in the "email" claim by default.
     */
    private String extractEmail(Authentication authentication) {
        try {
            if (authentication.getPrincipal() instanceof Jwt jwt) {
                return jwt.getClaim("email");
            }
        } catch (Exception e) {
            log.warn("Could not extract email from JWT: {}", e.getMessage());
        }
        return null;
    }

    /**
     * Maps Keycloak realm roles → your Role enum.
     *
     * Keycloak roles that matter (set these on the realm in Keycloak Admin):
     *   admin, seller, vendor, support, customer
     *
     * Precedence: admin > seller > vendor > support > customer
     */
    @SuppressWarnings("unchecked")
    private Role resolveRole(Authentication authentication) {
        try {
            if (authentication.getPrincipal() instanceof Jwt jwt) {
                Map<String, Object> realmAccess = jwt.getClaim("realm_access");
                if (realmAccess != null) {
                    List<String> roles = (List<String>) realmAccess.get("roles");
                    if (roles != null) {
                        if (roles.contains("admin"))   return Role.ADMIN;
                        if (roles.contains("seller"))  return Role.SELLER;
                        if (roles.contains("vendor"))  return Role.VENDOR;
                        if (roles.contains("support")) return Role.SUPPORT;
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Could not resolve role from JWT, defaulting to CUSTOMER: {}", e.getMessage());
        }
        return Role.CUSTOMER;
    }
}