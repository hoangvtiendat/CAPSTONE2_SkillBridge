package com.skillbridge.backend.repository;

import com.skillbridge.backend.dto.response.JobFeedItemResponse;
import com.skillbridge.backend.entity.Job;
import com.skillbridge.backend.enums.JobStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface JobRepository extends JpaRepository<Job, String> {
    @Query("""
        SELECT new com.skillbridge.backend.dto.response.JobFeedItemResponse(
            j.id, j.title, j.position, j.location, 
            j.salaryMin, j.salaryMax, j.createdAt, 
            c.name,c.imageUrl,sp.name, cat.name
        )
        FROM Job j
        LEFT JOIN j.company c
        LEFT JOIN j.category cat
        LEFT JOIN CompanySubscription cs ON cs.company.id = c.id AND cs.isActive = true
        LEFT JOIN cs.subscriptionPlan sp
        WHERE j.status = :status AND (:cursor IS NULL OR j.id < :cursor)
        AND (:categoryId IS NULL OR cat.id = :categoryId)
        AND (:location IS NULL OR j.location LIKE %:location%)
        AND (:salary IS NULL OR (
                        CAST(j.salaryMin AS double) <= :salary
                        AND CAST(j.salaryMax AS double) >= :salary
                    ))
        ORDER BY j.createdAt DESC
    """)
    List<JobFeedItemResponse> getJobFeed(
            @Param("cursor") String cursor,
            @Param("status") JobStatus status,
            Pageable pageable
    );

    @Query("""
        SELECT new com.skillbridge.backend.dto.response.JobFeedItemResponse(
            j.id, j.title, j.position, j.location, 
            j.salaryMin, j.salaryMax, j.createdAt, 
            c.name,c.imageUrl,sp.name, cat.name
        )
        FROM Job j
        LEFT JOIN j.company c
        LEFT JOIN j.category cat
        LEFT JOIN CompanySubscription cs ON cs.company.id = c.id AND cs.isActive = true
        LEFT JOIN cs.subscriptionPlan sp
        WHERE j.status = :status AND (:cursor IS NULL OR j.id < :cursor)
        AND (:categoryId IS NULL OR cat.id = :categoryId)
        AND (:location IS NULL OR j.location LIKE %:location%)
        AND (:salary IS NULL OR (
                        CAST(j.salaryMin AS double) <= :salary
                        AND CAST(j.salaryMax AS double) >= :salary
                    ))
        ORDER BY j.createdAt DESC
    """)
        List<JobFeedItemResponse> getJobFeedFiltered(
                @Param("cursor") String cursor,
                @Param("status") JobStatus status,
                @Param("categoryId") String categoryId,
                @Param("location") String location,
                @Param("salary") Double minSalary,
                Pageable pageable
        );

    @Query("SELECT js.job.id, s.name " +
            "FROM JobSkill js " +
            "LEFT JOIN js.skill s " +
            "WHERE js.job.id IN :jobIds")
    List<Object[]> findSkillNamesByJobIds(@Param("jobIds") List<String> jobIds);
}
