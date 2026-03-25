package com.ecommerce.second.Enum;

public enum VendorStatus {
    PENDING,    // just registered, awaiting admin approval
    APPROVED,   // active — assigned to a warehouse
    REJECTED,   // admin rejected the application
    SUSPENDED   // temporarily disabled
}