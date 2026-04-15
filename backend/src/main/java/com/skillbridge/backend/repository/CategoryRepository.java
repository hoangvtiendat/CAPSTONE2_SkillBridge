package com.skillbridge.backend.repository;

import com.skillbridge.backend.dto.response.CategoryResponse;
import com.skillbridge.backend.entity.Category;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, String> {
    /**
     * Kiểm tra xem tên danh mục đã tồn tại trong hệ thống chưa (Phân biệt hoa thường)
     */
    boolean existsByName(String name);

    /**
     * Kiểm tra sự tồn tại của tên danh mục trong hệ thống mà không phân biệt chữ hoa, chữ thường
     */
    boolean existsByNameIgnoreCase(String name);

    @Query("""
                SELECT c FROM Category c
                WHERE c.isDeleted = false
                AND LOWER(c.name) LIKE LOWER(CONCAT('%', :name, '%'))
                ORDER BY CASE
                    WHEN LOWER(c.name) LIKE LOWER(CONCAT(:name, '%')) THEN 1
                    ELSE 2
                END, c.name ASC
            """)
    List<Category> searchAutoCategory(@Param("name") String name, Pageable pageable);


    @Query("""
                SELECT new com.skillbridge.backend.dto.response.CategoryResponse(c.id, c.name)
                FROM Category c 
            """)
    List<CategoryResponse> findActiveCategories();

    @Query("SELECT c.id FROM Category c WHERE LOWER(c.name) = LOWER(:name)")
    String findIdByName(@org.springframework.data.repository.query.Param("name") String name);

    Page<Category> findByNameContainingIgnoreCase(String name, Pageable pageable);
}