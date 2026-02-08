package com.skillbridge.backend.repository;

import com.skillbridge.backend.entity.Candidate;
import com.skillbridge.backend.entity.CandidateSkill;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CandidateSkillRepository extends JpaRepository<CandidateSkill,String> {

    List<CandidateSkill> findByCandidate(Candidate candidate);

    @Modifying
    @Transactional
    @Query("DELETE FROM CandidateSkill cs WHERE cs.candidate = :candidate")
    void deleteByCandidate(Candidate candidate);
}
