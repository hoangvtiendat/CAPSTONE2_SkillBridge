package com.skillbridge.backend.repository;

import com.skillbridge.backend.entity.JobRejectionLog;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface JobRejectionLogRepository extends JpaRepository<JobRejectionLog, Long> {
    @Modifying
    @Transactional
    @Query("delete from JobRejectionLog j where j.jobId = :jobId")
    int deleteByJobId(@Param("jobId") String jobId);

    @Override
    List<JobRejectionLog> findAll();
}
