package com.ecommerce.second.repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.ecommerce.second.model.VarientImage;

@Repository
public interface VarImageRepo extends JpaRepository<VarientImage, Integer>{
    
    boolean existsByVarientIdAndPrimaryImageTrue(int id);

    void deleteByVarientId(int id);

    List<VarientImage> findByVarientId(int id);
}
