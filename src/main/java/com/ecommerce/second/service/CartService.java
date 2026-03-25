package com.ecommerce.second.service;

import com.ecommerce.second.dto.requestDTO.AddToCartRequest;
import com.ecommerce.second.dto.requestDTO.UpdateCartItemRequest;
import com.ecommerce.second.dto.responseDTO.CartItemResponse;
import com.ecommerce.second.dto.responseDTO.CartResponse;
import com.ecommerce.second.exceptionHandling.ProductNotFoundException;
import com.ecommerce.second.model.*;
import com.ecommerce.second.repo.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
@RequiredArgsConstructor
public class CartService {

    private final Logger log = LoggerFactory.getLogger(getClass());

    private final CartRepo cartRepo;
    private final CartItemRepo cartItemRepo;
    private final ProductRepo productRepo;
    private final ProductVarientsRepo variantRepo;
    private final ProductImagesRepo imageRepo;

    // ─────────────────────────────────────────────────────────────
    // View cart
    // ─────────────────────────────────────────────────────────────

    public CartResponse getCart(Authentication auth) {
        Cart cart = getOrCreateCart(auth.getName());
        return toCartResponse(cart);
    }

    // ─────────────────────────────────────────────────────────────
    // Add item  (upsert — increments qty if product+variant already in cart)
    // ─────────────────────────────────────────────────────────────

    public CartResponse addItem(AddToCartRequest req, Authentication auth) {
        String keycloakId = auth.getName();
        Cart cart = getOrCreateCart(keycloakId);

        Products product = productRepo.findById(req.getProductId())
                .orElseThrow(() -> new ProductNotFoundException("Product not found: " + req.getProductId()));

        ProductVariant variant = null;
        BigDecimal price = product.getPrice();

        if (req.getVariantId() != null) {
            variant = variantRepo.findById(req.getVariantId())
                    .orElseThrow(() -> new ProductNotFoundException("Variant not found: " + req.getVariantId()));

            if (variant.getProductId() != req.getProductId()) {
                throw new IllegalArgumentException("Variant does not belong to this product");
            }
            price = variant.getPrice();
        }

        // Check if this line already exists in the cart
        Integer variantId = variant != null ? variant.getId() : null;
        Optional<CartItem> existing = cartItemRepo.findByCartIdAndProductIdAndVariantId(
                cart.getId(), product.getId(), variantId);

        if (existing.isPresent()) {
            CartItem item = existing.get();
            item.setQuantity(item.getQuantity() + req.getQuantity());
            cartItemRepo.save(item);
            log.debug("Cart item qty incremented: cartId={}, productId={}", cart.getId(), product.getId());
        } else {
            cartItemRepo.save(CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .variant(variant)
                    .quantity(req.getQuantity())
                    .priceAtAddition(price)
                    .build());
            log.debug("Cart item added: cartId={}, productId={}", cart.getId(), product.getId());
        }

        // Re-fetch to get updated totals
        return toCartResponse(cartRepo.findById(cart.getId()).orElseThrow());
    }

    // ─────────────────────────────────────────────────────────────
    // Update item quantity (0 = remove the line)
    // ─────────────────────────────────────────────────────────────

    public CartResponse updateItem(int cartItemId, UpdateCartItemRequest req, Authentication auth) {
        CartItem item = getCartItemAndVerifyOwner(cartItemId, auth.getName());

        if (req.getQuantity() == 0) {
            cartItemRepo.delete(item);
            log.debug("Cart item removed: id={}", cartItemId);
        } else {
            item.setQuantity(req.getQuantity());
            cartItemRepo.save(item);
        }

        return toCartResponse(cartRepo.findByKeycloakId(auth.getName()).orElseThrow());
    }

    // ─────────────────────────────────────────────────────────────
    // Remove a single item
    // ─────────────────────────────────────────────────────────────

    public CartResponse removeItem(int cartItemId, Authentication auth) {
        CartItem item = getCartItemAndVerifyOwner(cartItemId, auth.getName());
        cartItemRepo.delete(item);
        log.debug("Cart item removed: id={}", cartItemId);
        return toCartResponse(cartRepo.findByKeycloakId(auth.getName()).orElseThrow());
    }

    // ─────────────────────────────────────────────────────────────
    // Clear entire cart
    // ─────────────────────────────────────────────────────────────

    public void clearCart(Authentication auth) {
        Cart cart = getOrCreateCart(auth.getName());
        cartItemRepo.deleteByCartId(cart.getId());
        log.info("Cart cleared: keycloakId={}", auth.getName());
    }

    // ─────────────────────────────────────────────────────────────
    // Internal — called by OrderService after checkout
    // ─────────────────────────────────────────────────────────────

    public Cart getCartForCheckout(String keycloakId) {
        return cartRepo.findByKeycloakId(keycloakId)
                .filter(c -> !c.getItems().isEmpty())
                .orElseThrow(() -> new IllegalStateException("Cart is empty"));
    }

    public void clearCartById(int cartId) {
        cartItemRepo.deleteByCartId(cartId);
    }

    // ─────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────

    private Cart getOrCreateCart(String keycloakId) {
        return cartRepo.findByKeycloakId(keycloakId)
                .orElseGet(() -> cartRepo.save(Cart.builder().keycloakId(keycloakId).build()));
    }

    private CartItem getCartItemAndVerifyOwner(int cartItemId, String keycloakId) {
        CartItem item = cartItemRepo.findById(cartItemId)
                .orElseThrow(() -> new IllegalArgumentException("Cart item not found: " + cartItemId));

        if (!item.getCart().getKeycloakId().equals(keycloakId)) {
            throw new com.ecommerce.second.exceptionHandling.AccessDeniedException(
                    "This cart item does not belong to you");
        }
        return item;
    }

    private CartResponse toCartResponse(Cart cart) {
        List<CartItemResponse> items = cart.getItems().stream()
                .map(this::toCartItemResponse)
                .toList();

        return new CartResponse(
                cart.getId(),
                items,
                cart.totalItemCount(),
                cart.totalAmount()
        );
    }

    private CartItemResponse toCartItemResponse(CartItem item) {
        // Primary image URL
        String imageUrl = imageRepo.findByProductId(item.getProduct().getId())
                .stream()
                .filter(ProductImages::isPrimaryImage)
                .map(ProductImages::getImageUrl)
                .findFirst()
                .orElse("");

        // Variant label e.g. "color: red"
        String variantLabel = null;
        if (item.getVariant() != null) {
            variantLabel = "SKU: " + item.getVariant().getSkuCode();
        }

        return new CartItemResponse(
                item.getId(),
                item.getProduct().getId(),
                item.getProduct().getName(),
                imageUrl,
                item.getVariant() != null ? item.getVariant().getId() : null,
                variantLabel,
                item.getQuantity(),
                item.getPriceAtAddition(),
                item.lineTotal()
        );
    }
}