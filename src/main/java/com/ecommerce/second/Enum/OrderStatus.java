package com.ecommerce.second.Enum;

public enum OrderStatus {

    // ── Customer journey ──────────────────────────────────────────
    PLACED,             // customer placed the order, payment pending / COD
    PAYMENT_CONFIRMED,
    DELIVERED,  // payment received (online) or COD accepted

    // ── Vendor / warehouse journey ────────────────────────────────
    CONFIRMED,          // vendor confirmed the order
    PACKED,             // item packed, ready to hand off to courier
    SHIPPED,            // picked up by courier, in transit
    OUT_FOR_DELIVERY,   // last-mile: with the delivery agent
    ARRIVED,            // delivered to customer address

    // ── Exception states ──────────────────────────────────────────
    DELIVERY_FAILED,    // delivery attempted but failed
    CANCELLED,          // cancelled by customer or admin before shipping
    RETURN_REQUESTED,   // customer raised return request
    RETURN_PICKED_UP,   // return item picked up by courier
    REFUNDED            // money returned to customer
}