package com.ecommerce.second.repo;
 
import com.ecommerce.second.Enum.VendorStatus;
import com.ecommerce.second.model.Vendor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
 
import java.util.Optional;
 
@Repository
public interface VendorRepo extends JpaRepository<Vendor, Integer> {
    Optional<Vendor> findByKeycloakId(String keycloakId);
    boolean existsByKeycloakId(String keycloakId);
    boolean existsByGstNumber(String gstNumber);
    Page<Vendor> findByStatus(VendorStatus status, Pageable pageable);
}