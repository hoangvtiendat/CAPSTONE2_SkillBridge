package com.skillbridge.backend.repository;

import com.skillbridge.backend.entity.Candidate;
import com.skillbridge.backend.entity.Job;
import com.skillbridge.backend.entity.JobInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobInvitationRepository extends JpaRepository<JobInvitation, String> {
    List<JobInvitation> findByCandidateIdOrderByCreatedAtDesc(String candidateId);

    boolean existsByJobAndCandidate(Job job, Candidate candidate);
}