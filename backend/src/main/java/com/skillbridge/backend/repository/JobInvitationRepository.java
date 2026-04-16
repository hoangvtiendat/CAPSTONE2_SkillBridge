package com.skillbridge.backend.repository;

import com.skillbridge.backend.entity.Candidate;
import com.skillbridge.backend.entity.Job;
import com.skillbridge.backend.entity.JobInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface JobInvitationRepository extends JpaRepository<JobInvitation, String> {
    Optional<JobInvitation> findByJobAndCandidate(Job job, Candidate candidate);
}