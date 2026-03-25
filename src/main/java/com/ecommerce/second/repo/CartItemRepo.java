package com.ecommerce.second.repo;
 
import com.ecommerce.second.model.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
 
import java.util.Optional;
 
@Repository
public interface CartItemRepo extends JpaRepository<CartItem, Integer> {
 
    /** Find an existing cart line for the same product+variant combo */
    Optional<CartItem> findByCartIdAndProductIdAndVariantId(
            int cartId, int productId, Integer variantId);
 
    void deleteByCartId(int cartId);
}