package com.ecommerce.second.repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.ecommerce.second.model.VariantAttribute;

@Repository
public interface VarientAttrRepo extends JpaRepository<VariantAttribute, Integer>{
    
    boolean existsBySkuCode(String skuCode);

    void deleteBySkuCode(String skuCode);

    List<VariantAttribute> findByProductId(int productId);

    List<VariantAttribute> findByProduct_IdAndName(int productId, String name);
}
