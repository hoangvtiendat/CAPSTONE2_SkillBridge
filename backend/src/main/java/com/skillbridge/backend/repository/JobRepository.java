package com.skillbridge.backend.repository;

import com.skillbridge.backend.entity.Job;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JobRepository extends JpaRepository<Job, String> {


}
