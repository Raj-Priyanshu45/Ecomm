package com.ecommerce.second.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "cart_item",
    indexes = {
        @Index(name = "idx_ci_cart", columnList = "cart_id")
    }
)
public class CartItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cart_id", nullable = false)
    private Cart cart;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Products product;

    /**
     * Nullable — null means the base product (no variant selected).
     * If the product has variants, frontend must send variantId.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id")
    private ProductVariant variant;

    @Column(nullable = false)
    private int quantity;

    /**
     * Price snapshot at the time the item was added.
     * Protects against price changes mid-session.
     */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal priceAtAddition;

    // ── helper ───────────────────────────────────────────────────

    public BigDecimal lineTotal() {
        return priceAtAddition.multiply(BigDecimal.valueOf(quantity));
    }
}