package com.skillbridge.backend.repository;

import com.skillbridge.backend.entity.Application;
import com.skillbridge.backend.entity.Candidate;
import com.skillbridge.backend.entity.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, String>, JpaSpecificationExecutor<Application> {

    boolean existsByJobAndCandidate(Job job, Candidate candidate);

    List<Application> findByJob_Id(String jobId);
}
