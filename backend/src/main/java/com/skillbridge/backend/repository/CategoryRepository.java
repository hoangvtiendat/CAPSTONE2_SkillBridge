package com.skillbridge.backend.repository;

import com.skillbridge.backend.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoryRepository  extends JpaRepository<Category, String> {
    boolean existsByName(String name);
    boolean existsById(String id);
}
