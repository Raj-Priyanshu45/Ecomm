package com.ecommerce.second.model;

import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import com.ecommerce.second.Enum.IndianState;
import com.ecommerce.second.Enum.VendorStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
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
@EntityListeners(AuditingEntityListener.class)
@Table(
    name = "vendor",
    indexes = {
        @Index(name = "idx_vendor_keycloak", columnList = "keycloak_id"),
        @Index(name = "idx_vendor_status",   columnList = "status")
    }
)
public class Vendor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    /**
     * Keycloak sub (UUID) of the vendor user.
     * The VENDOR role is set on the Keycloak realm side;
     * we store the sub here so we can look up the vendor in one query.
     */
    @Column(name = "keycloak_id", nullable = false, unique = true)
    private String keycloakId;

    @Column(nullable = false)
    private String email;

    private String phone;

    private String addressLine;

    private String city;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IndianState state;

    private String pincode;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false)
    private VendorStatus status = VendorStatus.PENDING;

    /**
     * Set by admin when approving — points to the warehouse for this vendor's state.
     * Null while PENDING or REJECTED.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id")
    private Warehouse warehouse;

    /** Optional note from admin (rejection reason, remarks, etc.) */
    private String adminNote;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime registeredAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}