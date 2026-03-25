package com.ecommerce.second.repo;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.ecommerce.second.model.Products;

@Repository
public interface ProductRepo extends JpaRepository<Products, Integer> {

    Optional<Products> findByIdAndSeller_Id(int id, int sellerId);

    Page<Products> findByTags_Slug(String slug, Pageable pageable);

    Page<Products> findByNameContainingIgnoreCase(String q, Pageable pageable);
}