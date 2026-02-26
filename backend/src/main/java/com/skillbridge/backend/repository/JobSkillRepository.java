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
public interface JobSkillRepository extends JpaRepository<JobSkill, Long> {
    @Modifying
    @Query("DELETE FROM JobSkill js WHERE js.skill.id = :skillId")
    void deleteBySkillId(@Param("skillId") String skillId);

    @Modifying
    @Query("DELETE FROM JobSkill js WHERE js.job.id = :jobId")
    void deleteByJobId(@Param("jobId") String jobId);
}
