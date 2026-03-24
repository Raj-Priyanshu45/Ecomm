package com.ecommerce.second.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.ecommerce.second.model.ProductVariant;

@Repository
public interface ProductVarientsRepo extends JpaRepository<ProductVariant , Integer> {
    
}
