package com.skillbridge.backend.repository;

import com.skillbridge.backend.entity.CVJobEvaluation;
import com.skillbridge.backend.entity.Candidate;
import com.skillbridge.backend.entity.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CVJobEvaluationRepository extends JpaRepository<CVJobEvaluation, String> {
    Optional<CVJobEvaluation> findByCandidateAndJob(Candidate candidate, Job job);

    // Lấy danh sách tất cả các bài đánh giá của một ứng viên (để hiện lịch sử ở Profile)
    List<CVJobEvaluation> findByCandidateOrderByCreatedAtDesc(Candidate candidate);

    // Lấy danh sách các ứng viên đã đánh giá vào một Job (dành cho phía Recruiter xem)
    List<CVJobEvaluation> findByJobId(String jobId);

    Optional<CVJobEvaluation> findByJobAndCandidate(Job job, Candidate candidate);
    Optional<CVJobEvaluation> findByJobAndCandidateAndCreateByUserId(Job job, Candidate candidate, String userId);

}
