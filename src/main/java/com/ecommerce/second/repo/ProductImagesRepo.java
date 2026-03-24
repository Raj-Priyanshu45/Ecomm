package com.ecommerce.second.repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.ecommerce.second.model.ProductImages;


@Repository
public interface ProductImagesRepo extends JpaRepository<ProductImages, Integer>{
 
    List<ProductImages> findByProductId(int id);

    boolean existsByProductIdAndId(int productId , int id);

    void deleteByProductId(int id);

    boolean existsByProductIdAndPrimaryImageTrue(int productId);

    @Modifying
    @Query("UPDATE ProductImages p SET p.primaryImage = false WHERE p.id = :productId")
    void clearPrimaryImage(@Param("productId") int id);

    @Modifying
    @Query("UPDATE ProductImages p SET p.primaryImage = true WHERE p.id = :productId")
    void updatePrimaryImage(@Param("productId") int id);
}