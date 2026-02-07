package com.skillbridge.backend.repository;

import com.skillbridge.backend.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository  extends JpaRepository<Category, String> {

}
