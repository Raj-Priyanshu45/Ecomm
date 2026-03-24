package com.ecommerce.second.repo;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.ecommerce.second.model.User;


@Repository
public interface UserRepo extends JpaRepository<User, Integer>{
    
    Optional<User> findByKeyCloakId(String keyCloakId);
}