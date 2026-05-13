package com.skillbridge.backend.repository;

import com.skillbridge.backend.entity.Application;
import com.skillbridge.backend.entity.Candidate;
import com.skillbridge.backend.entity.Job;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, String>, JpaSpecificationExecutor<Application> {

    @EntityGraph(attributePaths = {"job", "job.company", "job.jobSkills", "job.jobSkills.skill", "candidate", "candidate.user"})
    Optional<Application> findWithJobContextById(String id);
    /** Kiểm tra xem ứng viên đã nộp đơn vào công việc cụ thể này chưa */
    boolean existsByJobAndCandidate(Job job, Candidate candidate);

    @EntityGraph(attributePaths = {"job", "job.company", "candidate", "candidate.user"})
    List<Application> findByJob_Company_Id(String companyId);

    @EntityGraph(attributePaths = {"job", "candidate", "candidate.user"})
    List<Application> findByJob_Id(String jobId);

    Optional<Application> findByCandidateIdAndJobId(String candidateId, String jobId);

    Application findByCandidate(@NotNull(message = "Ứng viên không được để trống") Candidate candidate);

    List<Application> findAllByCandidate(Candidate candidate);

    List<Application> findAllByCandidateIdOrderByCreatedAtDesc(String candidateId);

    void deleteByCandidate(@NotNull(message = "Ứng viên không được để trống") Candidate candidate);

    @Query("SELECT a.candidate.id FROM Application a WHERE a.job.id = :jobId")
    List<String> findCandidateIdsByJobId(@Param("jobId") String jobId);
}
