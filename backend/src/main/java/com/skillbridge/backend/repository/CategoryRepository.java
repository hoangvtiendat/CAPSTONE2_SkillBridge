package com.skillbridge.backend.repository;

import com.skillbridge.backend.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoryRepository  extends JpaRepository<Category, String> {
    /** Kiểm tra xem tên danh mục đã tồn tại trong hệ thống chưa (Phân biệt hoa thường) */
    boolean existsByName(String name);

    /** Kiểm tra sự tồn tại của tên danh mục trong hệ thống mà không phân biệt chữ hoa, chữ thường */
    boolean existsByNameIgnoreCase(String name);
}