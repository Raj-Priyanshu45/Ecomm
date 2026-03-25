package com.ecommerce.second.repo;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.ecommerce.second.model.Review;

@Repository
public interface ReviewRepo extends JpaRepository<Review, Long> {

    Page<Review> findByProductIdOrderByIdDesc(int productId, Pageable pageable);

    Optional<Review> findByProductIdAndUserId(int productId, int userId);

    boolean existsByProductIdAndUserId(int productId, int userId);
}