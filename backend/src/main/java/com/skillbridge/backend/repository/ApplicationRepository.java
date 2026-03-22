package com.skillbridge.backend.repository;

import com.skillbridge.backend.entity.Application;
import com.skillbridge.backend.entity.Candidate;
import com.skillbridge.backend.entity.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, String>, JpaSpecificationExecutor<Application> {
    /** Kiểm tra xem ứng viên đã nộp đơn vào công việc cụ thể này chưa */
    boolean existsByJobAndCandidate(Job job, Candidate candidate);

    /** Lấy danh sách tất cả các đơn ứng tuyển của một bài đăng tuyển dụng cụ thể */
    List<Application> findByJob_Id(String jobId);
}
