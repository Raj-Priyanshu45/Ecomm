package com.ecommerce.second.model;

import com.ecommerce.second.Enum.IndianState;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(
    name = "warehouse",
    indexes = {
        @Index(name = "idx_warehouse_state", columnList = "state", unique = true)
    }
)
public class Warehouse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true)
    private IndianState state;

    @Column(nullable = false)
    private String addressLine;

    @Column(nullable = false)
    private String city;

    @Column(nullable = false)
    private String pincode;

    private String contactEmail;

    private String contactPhone;

    /** Soft capacity limit (number of SKU units). 0 = unlimited. */
    @Builder.Default
    private int capacityLimit = 0;

    @Builder.Default
    private boolean active = true;
}