package com.ecommerce.second.repo;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.ecommerce.second.model.Tags;


@Repository
public interface TagRepo extends JpaRepository<Tags, Integer> {
    Optional<Tags> findBySlug(String slug);

    List<Tags> findBySlugIn(List<String> slugs);
}