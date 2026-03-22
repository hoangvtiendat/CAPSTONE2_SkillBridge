package com.skillbridge.backend.repository;

import com.skillbridge.backend.entity.Job;
import com.skillbridge.backend.entity.JobSkill;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobSkillRepository extends JpaRepository<JobSkill, String> {

    /** Kiểm tra xem một kỹ năng có đang được sử dụng bởi bất kỳ bài đăng tuyển dụng nào không */
    boolean existsBySkillId(String skillId);

    /** Xóa toàn bộ danh sách kỹ năng của một bài đăng tuyển dụng cụ thể */
    @Modifying
    @Transactional
    @Query("""
            UPDATE JobSkill js
            SET js.isDeleted = true
            WHERE js.job.id = :jobId
    """)
    void deleteByJobId(@Param("jobId") String jobId);
}
