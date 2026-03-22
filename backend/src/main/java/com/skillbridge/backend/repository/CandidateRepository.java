package com.skillbridge.backend.repository;

import com.skillbridge.backend.entity.Candidate;
import com.skillbridge.backend.entity.CandidateSkill;
import com.skillbridge.backend.entity.Job;
import com.skillbridge.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

import java.util.List;

@Repository
public interface CandidateRepository extends JpaRepository<Candidate, String>, JpaSpecificationExecutor<Candidate> {
    /** Tìm kiếm thông tin ứng viên dựa trên định danh người dùng (User ID) */
    Optional<Candidate> findByUser_Id(String userId);
}
