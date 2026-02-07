package com.skillbridge.backend.repository;

import com.skillbridge.backend.entity.Candidate;
import com.skillbridge.backend.entity.Job;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CandidateRepository extends JpaRepository<Candidate, String> {

}
