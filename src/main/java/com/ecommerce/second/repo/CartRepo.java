package com.ecommerce.second.repo;
 
import com.ecommerce.second.model.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
 
import java.util.Optional;
 
@Repository
public interface CartRepo extends JpaRepository<Cart, Integer> {
    Optional<Cart> findByKeycloakId(String keycloakId);
}