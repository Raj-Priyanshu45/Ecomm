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
@Table(name = "order_item",
    indexes = {
        @Index(name = "idx_oi_order",   columnList = "order_id"),
        @Index(name = "idx_oi_product", columnList = "product_id")
    }
)
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Products product;

    /** Null if customer ordered the base product without a variant */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id")
    private ProductVariant variant;

    @Column(nullable = false)
    private int quantity;

    /** Price snapshot at checkout */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal priceAtOrder;

    /** Keycloak ID of the seller who owns this item */
    private String sellerKeycloakId;

    /** SKU code for inventory deduction */
    private String skuCode;

    public BigDecimal lineTotal() {
        return priceAtOrder.multiply(BigDecimal.valueOf(quantity));
    }
}