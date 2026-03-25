package com.ecommerce.second.repo;

import com.ecommerce.second.model.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AddressRepo extends JpaRepository<Address, Integer> {

    List<Address> findByKeycloakId(String keycloakId);

    Optional<Address> findByIdAndKeycloakId(int id, String keycloakId);

    @Modifying
    @Query("UPDATE Address a SET a.isDefault = false WHERE a.keycloakId = :keycloakId")
    void clearDefaultForUser(@Param("keycloakId") String keycloakId);
}