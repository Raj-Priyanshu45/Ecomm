package com.ecommerce.second.repo;
 
import com.ecommerce.second.Enum.IndianState;
import com.ecommerce.second.model.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
 
import java.util.Optional;
 
@Repository
public interface WarehouseRepo extends JpaRepository<Warehouse, Integer> {
    Optional<Warehouse> findByState(IndianState state);
    boolean existsByState(IndianState state);
}