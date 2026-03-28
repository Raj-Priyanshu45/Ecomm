package com.ecommerce.second.repo;
 
import com.ecommerce.second.Enum.OrderStatus;
import com.ecommerce.second.model.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
 
import org.springframework.data.repository.query.Param;

@Repository
public interface OrderRepo extends JpaRepository<Order, Long> {

    @Query("SELECT CASE WHEN COUNT(o) > 0 THEN true ELSE false END FROM Order o JOIN o.items i WHERE o.keycloakId = :keycloakId AND i.product.id = :productId AND o.status = 'DELIVERED'")
    boolean hasUserPurchasedProduct(@Param("keycloakId") String keycloakId, @Param("productId") int productId);

 
    Page<Order> findByKeycloakIdOrderByPlacedAtDesc(String keycloakId, Pageable pageable);
 
    Page<Order> findByWarehouseIdOrderByPlacedAtDesc(int warehouseId, Pageable pageable);
 
    Page<Order> findByStatusOrderByPlacedAtDesc(OrderStatus status, Pageable pageable);
 
    Page<Order> findByWarehouseIdAndStatusOrderByPlacedAtDesc(
            int warehouseId, OrderStatus status, Pageable pageable);
}