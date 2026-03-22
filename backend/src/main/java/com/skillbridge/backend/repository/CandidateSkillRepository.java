package com.skillbridge.backend.repository;

import com.skillbridge.backend.entity.Candidate;
import com.skillbridge.backend.entity.CandidateSkill;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CandidateSkillRepository extends JpaRepository<CandidateSkill,String> {
    /**
     * Lấy danh sách tất cả các kỹ năng gắn liền với một ứng viên cụ thể.
     * * @param candidate Thực thể ứng viên cần lấy kỹ năng
     * @return Danh sách CandidateSkill chứa thông tin kỹ năng và cấp độ (nếu có)
     */
    List<CandidateSkill> findByCandidate(Candidate candidate);

    /** Xóa toàn bộ các kỹ năng liên quan đến một ứng viên dựa trên ID của ứng viên đó */
    @Transactional
    void deleteByCandidate_Id(String candidateId);
}
