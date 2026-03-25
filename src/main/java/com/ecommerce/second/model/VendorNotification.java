package com.ecommerce.second.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Persisted notification for a vendor.
 * The frontend polls GET /api/vendor/notifications?unread=true
 * and renders these as pop-up messages.
 */
@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
@Table(
    name = "vendor_notification",
    indexes = {
        @Index(name = "idx_vn_vendor",  columnList = "vendor_id"),
        @Index(name = "idx_vn_read",    columnList = "is_read")
    }
)
public class VendorNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", nullable = false)
    private Vendor vendor;

    /** Short title shown in the pop-up header */
    @Column(nullable = false)
    private String title;

    /** Full message body */
    @Column(nullable = false, length = 1000)
    private String message;

    /** Optional link to the related order / product */
    private String referenceId;

    @Builder.Default
    @Column(name = "is_read")
    private boolean read = false;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}