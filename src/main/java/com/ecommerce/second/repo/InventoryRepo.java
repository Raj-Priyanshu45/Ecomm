package com.ecommerce.second.repo;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.ecommerce.second.model.Inventory;

@Repository
public interface InventoryRepo extends JpaRepository<Inventory, Integer>{
    
    void deleteBySkuCode(String skuCode);

    Optional<Inventory> findBySkuCode(String skuCode);
}
