package com.skillbridge.backend.repository;

import com.skillbridge.backend.dto.MonthlyJobDTO;
import com.skillbridge.backend.dto.response.AdminJobFeedItemResponse;
import com.skillbridge.backend.dto.response.JobFeedItemResponse;
import com.skillbridge.backend.entity.Job;
import com.skillbridge.backend.entity.User;
import com.skillbridge.backend.enums.JobStatus;
import com.skillbridge.backend.enums.ModerationStatus;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface JobRepository extends JpaRepository<Job, String> {


    /** Lấy toàn bộ danh sách thực thể Job thuộc về một công ty */
    List<Job> findJobsByCompanyId(@Param("companyId") String companyId);

    /** Đếm tổng số lượng công việc dựa trên trạng thái (Ví dụ: Đếm có bao nhiêu bài đang OPEN) */
    long countByStatus(JobStatus status);

    /** Thống kê số lượng bài đăng mới được tạo ra kể từ một mốc thời gian cụ thể.*/
    long countByCreatedAtAfter(LocalDateTime createdAtAfter);

    /** Đếm số lượng bài đăng trong một khoảng thời gian xác định (Từ ngày... đến ngày...) */
    long countByCreatedAtBetween(LocalDateTime createdAtAfter, LocalDateTime createdAtBefore);

    /** Truy vấn nhanh tên các kỹ năng yêu cầu của danh sách công việc */
    @Query("""
        SELECT js.job.id, s.name
        FROM JobSkill js
        LEFT JOIN js.skill s
        WHERE js.job.id IN :jobIds
      """)
    List<Object[]> findSkillNamesByJobIds(@Param("jobIds") List<String> jobIds);

    /** Cập nhật trạng thái hàng loạt cho công việc của một công ty (Ví dụ: Khóa công ty -> Đóng bài đăng) */
    @Modifying
    @Transactional
    @Query("""
        UPDATE Job j
        SET j.status = :newStatus
        WHERE j.company.id = :companyId
        AND j.status = :oldStatus
        """)
    void updateStatusByCompanyIdAndCurrentStatus(
            @Param("companyId") String companyId,
            @Param("oldStatus") JobStatus oldStatus,
            @Param("newStatus") JobStatus newStatus
    );

    /** Thống kê số lượng bài đăng mới trong 6 tháng gần nhất để vẽ biểu đồ tăng trưởng */
    @Query("""
                SELECT new com.skillbridge.backend.dto.MonthlyJobDTO(
                    MONTH(j.createdAt),
                    COUNT(j)
                )
                FROM Job j
                WHERE j.createdAt >= :fromDate
                GROUP BY MONTH(j.createdAt)
                ORDER BY MONTH(j.createdAt)
            """)
    List<MonthlyJobDTO> jobGrowthLast6Months(@Param("fromDate") LocalDateTime fromDate);

    /** Cập nhật thời hạn hiển thị (postingDay) cho các bài đăng cũ khi công ty gia hạn gói cước */
    @Modifying
    @Transactional
    @Query("""
        UPDATE Job j
        SET j.postingDay = :days
        WHERE j.company.id = :companyId
        AND j.status IN :statuses
    """)
    int updateDurationForOldJobs(
            @Param("companyId") String companyId,
            @Param("days") int days,
            @Param("statuses") List<JobStatus> statuses
    );

    /** Cập nhật trạng thái đồng loạt cho tất cả các bài đăng tuyển dụng của một công ty cụ thể */
    @Modifying
    @Transactional
    @Query("""
            UPDATE Job j
            SET j.status = :status
            WHERE j.company.id = :companyId
    """)
    void updateStatusByCompanyId(@Param("companyId") String companyId, @Param("status") JobStatus status);

    /** tăng view */
    @Modifying
    @Transactional
    @Query("UPDATE Job j SET j.viewCount = j.viewCount + 1 WHERE j.id = :jobId")
    void incrementViewCount(@Param("jobId") String jobId);

    @Query("""
        SELECT new com.skillbridge.backend.dto.response.JobFeedItemResponse(
            j.id, j.title,j.description, j.location,
            j.salaryMin, j.salaryMax, j.createdAt,
            c.name,c.imageUrl,soc.name, cat.name
        )
        FROM Job j
        LEFT JOIN j.company c
        LEFT JOIN j.category cat
        LEFT JOIN SubscriptionOfCompany soc ON soc.company.id = c.id
        WHERE j.status = :status
        AND (:categoryId IS NULL OR cat.id = :categoryId)
        AND soc.status = com.skillbridge.backend.enums.SubscriptionOfCompanyStatus.OPEN
        AND (:location IS NULL OR j.location LIKE %:location%)
        AND (:salary IS NULL OR (
                        CAST(j.salaryMin AS double) <= :salary
                        AND CAST(j.salaryMax AS double) >= :salary
                    ))
        ORDER BY j.createdAt DESC
    """)
    Page<JobFeedItemResponse> getJobFeedFiltered(
            @Param("status") JobStatus status,
            @Param("categoryId") String categoryId,
            @Param("location") String location,
            @Param("salary") Double salary,
            Pageable pageable
    );

    @Query("""
        SELECT DISTINCT new com.skillbridge.backend.dto.response.JobFeedItemResponse(
            j.id, j.title, j.description, j.location,
            j.salaryMin, j.salaryMax, j.createdAt,
            c.name, c.imageUrl, cs.name, cat.name
        )
        FROM Job j
        LEFT JOIN j.company c
        LEFT JOIN j.category cat
        LEFT JOIN c.subscriptions cs ON cs.isActive = true
        WHERE j.status = :status
        AND j.company.id = :companyId
        AND j.isDeleted = false
        AND (:categoryIds IS NULL OR (cat.id IN :categoryIds))
        ORDER BY j.createdAt DESC
    """)
    Page<JobFeedItemResponse> findJobsByCompanyIdWithPagination(
            @Param("companyId") String companyId,
            @Param("status") JobStatus status,
            @Param("categoryIds") List<String> categoryIds,
            Pageable pageable
    );

//    @Query("""
//        SELECT new com.skillbridge.backend.dto.response.AdminJobFeedItemResponse(
//            j.id, j.title, j.description, j.location, j.salaryMin,
//            j.salaryMax, j.createdAt, c.name, c.imageUrl,
//            sp.name, cat.name, j.status, j.moderationStatus
//        )
//        FROM Job j
//        LEFT JOIN j.company c
//        LEFT JOIN j.category cat
//        LEFT JOIN c.subscriptions cs ON cs.isActive = true
//        LEFT JOIN cs.subscriptionPlan sp
//        WHERE j.isDeleted = false
//        AND (:status IS NULL OR j.status = :status)
//        AND (:modStatus IS NULL OR j.moderationStatus = :modStatus)
//        ORDER BY j.createdAt DESC
//    """)
//    Page<AdminJobFeedItemResponse> adminGetJobs(
//            @Param("status") JobStatus status,
//            @Param("modStatus") ModerationStatus modStatus,
//            Pageable pageable
//    );

    @Query("""
        SELECT new com.skillbridge.backend.dto.response.AdminJobFeedItemResponse(
            j.id, j.title, j.description, j.location, j.salaryMin,
            j.salaryMax, j.createdAt, c.name, c.imageUrl,
            cs.name, cat.name, j.status, j.moderationStatus
        )
        FROM Job j
        LEFT JOIN j.company c
        LEFT JOIN j.category cat
        LEFT JOIN c.subscriptions cs ON cs.isActive = true
        WHERE j.isDeleted = false
        AND (:status IS NULL OR j.status = :status)
        AND (:modStatus IS NULL OR j.moderationStatus = :modStatus)
        AND (
            :cursor IS NULL OR
            j.createdAt < (SELECT j2.createdAt FROM Job j2 WHERE j2.id = :cursor) OR
            (j.createdAt = (SELECT j2.createdAt FROM Job j2 WHERE j2.id = :cursor) AND j.id < :cursor)
        )
        ORDER BY j.createdAt DESC
    """)
    List<AdminJobFeedItemResponse> adminGetJobs(
            @Param("cursor") String cursor,
            @Param("status") JobStatus status,
            @Param("modStatus") ModerationStatus modStatus,
            Pageable pageable
    );

    @Query("""
        SELECT new com.skillbridge.backend.dto.response.AdminJobFeedItemResponse(
            j.id, j.title, j.description, j.location, j.salaryMin,
            j.salaryMax, j.createdAt, c.name, c.imageUrl,
            cs.name, cat.name, j.status, j.moderationStatus
        )
        FROM Job j
        LEFT JOIN j.company c
        LEFT JOIN j.category cat
        LEFT JOIN c.subscriptions cs ON cs.isActive = true
        WHERE j.isDeleted = false
        AND j.status = com.skillbridge.backend.enums.JobStatus.PENDING
        AND (:modStatus IS NULL OR j.moderationStatus = :modStatus)
        AND (
            :cursor IS NULL OR
            j.createdAt > (SELECT j2.createdAt FROM Job j2 WHERE j2.id = :cursor) OR
            (j.createdAt = (SELECT j2.createdAt FROM Job j2 WHERE j2.id = :cursor) AND j.id > :cursor)
        )
        ORDER BY j.createdAt ASC
    """)
    List<AdminJobFeedItemResponse> adminGetJobPending(
            @Param("cursor") String cursor,
            @Param("modStatus") ModerationStatus modStatus,
            Pageable pageable
    );

    /// Lấy dạnh sách VECTOR từng JD của cty đó
    @Query(value = """
    SELECT j.id, j.vector_embedding 
    FROM jobs j 
    WHERE j.company_id = :companyId 
      AND j.vector_embedding IS NOT NULL 
      AND j.is_deleted = false
    """, nativeQuery = true)
    List<Object[]> ListAllVectorsByCompanyIdNative(@Param("companyId") String companyId);

    ///  Lấy chi tiết 1 JD
    @Override
    Optional<Job> findById(String jobId);


    ///  Lấy thông tin của ngừoi đăng
    @Query("SELECT j.companyMember.user FROM Job j WHERE j.id = :jobId AND j.company.id = :companyId")
    Optional<User> findUserByJobAndCompany(
            @Param("jobId") String jobId,
            @Param("companyId") String companyId
    );
}

