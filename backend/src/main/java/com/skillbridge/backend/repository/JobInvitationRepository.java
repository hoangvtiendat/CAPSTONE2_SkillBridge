package com.skillbridge.backend.repository;

import com.skillbridge.backend.entity.Candidate;
import com.skillbridge.backend.entity.Job;
import com.skillbridge.backend.entity.JobInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JobInvitationRepository extends JpaRepository<JobInvitation, String> {
    List<JobInvitation> findByCandidateIdOrderByCreatedAtDesc(String candidateId);

    boolean existsByJobAndCandidate(Job job, Candidate candidate);
    Optional<JobInvitation> findByJobAndCandidate(Job job, Candidate candidate);

    @Query("SELECT ji.candidate.id FROM JobInvitation ji WHERE ji.job.id = :jobId")
    List<String> findCandidateIdsByJobId(@Param("jobId") String jobId);

    @Query("SELECT ji FROM JobInvitation ji JOIN FETCH ji.candidate WHERE ji.job.id = :jobId")
    List<JobInvitation> findByJobId(@Param("jobId") String jobId);
}