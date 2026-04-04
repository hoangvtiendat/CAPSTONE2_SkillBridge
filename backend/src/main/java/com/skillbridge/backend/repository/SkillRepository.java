package com.skillbridge.backend.repository;

import com.skillbridge.backend.entity.Skill;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SkillRepository extends JpaRepository<Skill, String> {
    /**
     * Tìm kiếm gợi ý kỹ năng theo từ khóa (Autocomplete).
     * <p>Ví dụ: Nhập "jav" sẽ gợi ý "Java", "JavaScript".</p>
     * * @param name Từ khóa tìm kiếm
     * @return Danh sách kỹ năng chứa từ khóa, không phân biệt hoa thường
     */
    @Query("""
        SELECT s FROM Skill s
        WHERE s.isDeleted = false
        AND s.category.id = :categoryId
        AND LOWER(s.name) LIKE LOWER(CONCAT('%', :name, '%'))
        ORDER BY CASE
            WHEN LOWER(s.name) LIKE LOWER(CONCAT(:name, '%')) THEN 1
            ELSE 2
        END, s.name ASC
    """)
    List<Skill> searchAutoSkill(@Param("name") String name, @Param("categoryId") String categoryId, Pageable pageable);

    /** Tìm kiếm kỹ năng theo tên */
    List<Skill> findByName(String name);

    /** Kiểm tra trùng tên*/
    boolean existsByName(String name);

    /** Lấy toàn bộ kỹ năng thuộc một danh mục cụ thể */
    List<Skill> findByCategory_Id(String categoryId);
}
