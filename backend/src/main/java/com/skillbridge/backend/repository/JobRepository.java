package com.skillbridge.backend.repository;

import com.skillbridge.backend.entity.Job;
import com.skillbridge.backend.enums.JobStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JobRepository extends JpaRepository<Job, String> {
    List<Job> findAll();
    List<Job> findByStatus(JobStatus status);

}
