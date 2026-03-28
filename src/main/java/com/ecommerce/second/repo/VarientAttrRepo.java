package com.ecommerce.second.repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.ecommerce.second.model.VariantAttribute;

@Repository
public interface VarientAttrRepo extends JpaRepository<VariantAttribute, Integer> {

    boolean existsBySkuCode(String skuCode);

    void deleteBySkuCode(String skuCode);

    /** All attributes for a product — used by browse detail endpoint */
    List<VariantAttribute> findByProduct_Id(int productId);

    /** All values for a specific attribute key on a product (e.g. all "color" values) */
    List<VariantAttribute> findByProduct_IdAndName(int productId, String name);

    /** Attributes matching a specific SKU code */
    List<VariantAttribute> findBySkuCode(String skuCode);
}