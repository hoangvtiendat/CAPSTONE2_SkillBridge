package com.skillbridge.backend.repository;

import com.skillbridge.backend.entity.Candidate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CandidateRepository extends JpaRepository<Candidate, String>, JpaSpecificationExecutor<Candidate> {
    Optional<Candidate> findByUser_Id(String userId);

    /** Lọc ra nhữung canidate có trùng skill với job */
    @Query("""
        SELECT DISTINCT c FROM Candidate c
        JOIN CandidateSkill cs ON cs.candidate.id = c.id
        JOIN cs.skill s
        WHERE s.name IN :skillNames
        AND c.isOpenToWork = true
        AND c.id NOT IN (SELECT a.candidate.id FROM Application a WHERE a.job.id = :jobId)
        GROUP BY c
        ORDER BY COUNT(s.id) DESC
    """)
    List<Candidate> findCandidatesBySkillMatch(
        @Param("skillNames") List<String> skillNames,
        @Param("jobId") String jobId);

    @Query("SELECT c FROM Candidate c WHERE c.vectorEmbedding IS NOT NULL")
    List<Candidate> findAllWithVector();
}
