package com.ecommerce.second.repo;
 
import com.ecommerce.second.model.VendorNotification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
 
@Repository
public interface VendorNotificationRepo extends JpaRepository<VendorNotification, Long> {
 
    Page<VendorNotification> findByVendorIdOrderByCreatedAtDesc(int vendorId, Pageable pageable);
 
    Page<VendorNotification> findByVendorIdAndReadFalseOrderByCreatedAtDesc(int vendorId, Pageable pageable);
 
    long countByVendorIdAndReadFalse(int vendorId);
 
    @Modifying
    @Query("UPDATE VendorNotification n SET n.read = true WHERE n.vendor.id = :vendorId AND n.read = false")
    void markAllReadForVendor(@Param("vendorId") int vendorId);
}