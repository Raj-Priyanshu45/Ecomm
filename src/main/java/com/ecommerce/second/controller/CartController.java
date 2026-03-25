package com.ecommerce.second.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ecommerce.second.dto.requestDTO.AddToCartRequest;
import com.ecommerce.second.dto.requestDTO.UpdateCartItemRequest;
import com.ecommerce.second.dto.responseDTO.CartResponse;
import com.ecommerce.second.dto.responseDTO.Response;
import com.ecommerce.second.service.CartService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * ──────────────────────────────────────────────────────────────────────────────
 * CART ENDPOINTS   (CUSTOMER only)
 * ──────────────────────────────────────────────────────────────────────────────
 *  GET    /api/cart                         — view cart
 *  POST   /api/cart/items                   — add item (upserts qty)
 *  PUT    /api/cart/items/{cartItemId}      — change qty (0 = remove)
 *  DELETE /api/cart/items/{cartItemId}      — remove item
 *  DELETE /api/cart                         — clear entire cart
 * ──────────────────────────────────────────────────────────────────────────────
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;

    @GetMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<CartResponse> getCart(Authentication auth) {
        return ResponseEntity.ok(cartService.getCart(auth));
    }

    @PostMapping("/items")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<CartResponse> addItem(
            @RequestBody @Valid AddToCartRequest req,
            Authentication auth) {
        return ResponseEntity.status(201).body(cartService.addItem(req, auth));
    }

    @PutMapping("/items/{cartItemId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<CartResponse> updateItem(
            @PathVariable int cartItemId,
            @RequestBody @Valid UpdateCartItemRequest req,
            Authentication auth) {
        return ResponseEntity.ok(cartService.updateItem(cartItemId, req, auth));
    }

    @DeleteMapping("/items/{cartItemId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<CartResponse> removeItem(
            @PathVariable int cartItemId,
            Authentication auth) {
        return ResponseEntity.ok(cartService.removeItem(cartItemId, auth));
    }

    @DeleteMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Response> clearCart(Authentication auth) {
        cartService.clearCart(auth);
        return ResponseEntity.ok(new Response("Cart cleared"));
    }
}


