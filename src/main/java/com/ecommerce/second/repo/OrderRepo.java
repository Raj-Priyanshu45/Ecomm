package com.ecommerce.second.repo;
 
import com.ecommerce.second.Enum.OrderStatus;
import com.ecommerce.second.model.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
 
@Repository
public interface OrderRepo extends JpaRepository<Order, Long> {
 
    Page<Order> findByKeycloakIdOrderByPlacedAtDesc(String keycloakId, Pageable pageable);
 
    Page<Order> findByWarehouseIdOrderByPlacedAtDesc(int warehouseId, Pageable pageable);
 
    Page<Order> findByStatusOrderByPlacedAtDesc(OrderStatus status, Pageable pageable);
 
    Page<Order> findByWarehouseIdAndStatusOrderByPlacedAtDesc(
            int warehouseId, OrderStatus status, Pageable pageable);
}