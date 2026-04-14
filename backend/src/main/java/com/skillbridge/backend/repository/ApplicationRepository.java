package com.skillbridge.backend.repository;

import com.skillbridge.backend.entity.Application;
import com.skillbridge.backend.entity.Candidate;
import com.skillbridge.backend.entity.Job;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, String>, JpaSpecificationExecutor<Application> {
    /** Kiểm tra xem ứng viên đã nộp đơn vào công việc cụ thể này chưa */
    boolean existsByJobAndCandidate(Job job, Candidate candidate);

    @EntityGraph(attributePaths = {"job", "job.company", "candidate", "candidate.user"})
    List<Application> findByJob_Company_Id(String companyId);

    @EntityGraph(attributePaths = {"job", "candidate", "candidate.user"})
    List<Application> findByJob_Id(String jobId);

    Application findByCandidate(@NotNull(message = "Ứng viên không được để trống") Candidate candidate);
    List<Application> findAllByCandidate(Candidate candidate);

    void deleteByCandidate(@NotNull(message = "Ứng viên không được để trống") Candidate candidate);
}
