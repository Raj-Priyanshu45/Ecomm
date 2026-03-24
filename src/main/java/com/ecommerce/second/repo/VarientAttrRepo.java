package com.ecommerce.second.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.ecommerce.second.model.VariantAttribute;

@Repository
public interface VarientAttrRepo extends JpaRepository<VariantAttribute, Integer>{
    
    boolean existsBySkuCode(String skuCode);

    void deleteBySkuCode(String skuCode);
}
