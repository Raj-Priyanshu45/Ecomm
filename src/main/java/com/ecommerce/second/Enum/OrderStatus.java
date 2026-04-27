package com.ecommerce.second.Enum;

public enum OrderStatus {

    // ── Customer journey ──────────────────────────────────────────
    PLACED,             // customer placed the order, payment pending / COD
    DELIVERED,  // payment received COD accepted

    CONFIRMED,          // vendor confirmed the order
    PACKED,             // item packed, ready to hand off to courier
    SHIPPED,            // picked up by courier, in transit
    OUT_FOR_DELIVERY,   // last-mile: with the delivery agent

    DELIVERY_FAILED,    // delivery attempted but failed
    CANCELLED,          // cancelled by customer or admin before shipping
    RETURN_REQUESTED,   // customer raised return request
    RETURN_PICKED_UP,   // return item picked up by courier
    REFUNDED            // money returned to customer
}