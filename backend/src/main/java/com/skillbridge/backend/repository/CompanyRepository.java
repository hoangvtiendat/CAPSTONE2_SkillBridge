package com.skillbridge.backend.repository;

import com.skillbridge.backend.dto.TopCompanyDTO;
import com.skillbridge.backend.dto.response.CompanyFeedItemResponse;
import com.skillbridge.backend.dto.response.CompanyFeedResponse;
import com.skillbridge.backend.entity.Company;
import com.skillbridge.backend.entity.User;
import com.skillbridge.backend.enums.CompanyStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CompanyRepository extends JpaRepository<Company, String>, JpaSpecificationExecutor<Company> {

    /** Tìm kiếm công ty theo Mã số thuế. Dùng để kiểm tra tính duy nhất khi đăng ký doanh nghiệp */
    Optional<Company> findByTaxId(String taxId);

    /** Đếm số lượng công ty theo trạng thái (Dùng cho Dashboard Admin) */
    long countByStatus(CompanyStatus status);

    /** Thống kê số lượng công ty đăng ký mới sau một khoảng thời gian nhất định. */
    long countByCreatedAtAfter(LocalDateTime createdAtAfter);

    /** Thống kê số lượng công ty đăng ký trong một khoảng thời gian (ví dụ: trong tháng này). */
    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    /** Thống kê Top các công ty có số lượng bài đăng tuyển dụng nhiều nhất */
    @Query("""
        SELECT new com.skillbridge.backend.dto.TopCompanyDTO(
            c.id, c.name, COUNT(j)
        )
        FROM Company c
        LEFT JOIN Job j ON j.company.id = c.id AND j.isDeleted = false
        WHERE c.isDeleted = false
        GROUP BY c.id, c.name
        ORDER BY COUNT(j) DESC
    """)
    List<TopCompanyDTO> findTop5ByJobCount(Pageable pageable);











    @Query("""
        SELECT new com.skillbridge.backend.dto.response.CompanyFeedItemResponse(
            c.id, c.name, c.taxId, c.businessLicenseUrl, c.imageUrl, 
            c.description, c.address, c.websiteUrl, c.status, cs.name,
            (SELECT COUNT(j) FROM Job j WHERE j.company.id = c.id AND j.status = 'OPEN' AND j.isDeleted = false)
        )
        FROM Company c
        LEFT JOIN c.subscriptions cs ON cs.isActive = true
        WHERE c.isDeleted = false
        AND (:status IS NULL OR c.status = :status)
        ORDER BY c.createdAt DESC
    """)
    Page<CompanyFeedItemResponse> getCompanyFeed(
            @Param("status") CompanyStatus status,
            Pageable pageable
    );
    @Query("""
        SELECT new com.skillbridge.backend.dto.response.CompanyFeedItemResponse(
            c.id, c.name, c.taxId, c.businessLicenseUrl, c.imageUrl,
            c.description, c.address, c.websiteUrl, c.status, cs.name,
            (SELECT COUNT(j) FROM Job j WHERE j.company.id = c.id AND j.status = 'OPEN' AND j.isDeleted = false)
        )
        FROM Company c
        LEFT JOIN c.subscriptions cs ON cs.isActive = true
        WHERE (:status IS NULL OR c.status = :status)
        AND c.isDeleted = false
        AND (:keyword IS NULL OR LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%')))
        AND (:categoryId IS NULL OR EXISTS (
            SELECT 1 FROM Job j
            WHERE j.company.id = c.id 
            AND j.category.id = :categoryId 
            AND j.status = 'OPEN' 
            AND j.isDeleted = false
        ))
        ORDER BY c.createdAt DESC
    """)
    Page<CompanyFeedItemResponse> getCompanyFeedSearch(
            @Param("status") CompanyStatus status,
            @Param("keyword") String keyword,
            @Param("categoryId") String categoryId,
            Pageable pageable
    );

    @Query("""
        SELECT new com.skillbridge.backend.dto.response.CompanyFeedItemResponse(
            c.id, c.name, c.taxId, c.businessLicenseUrl, c.imageUrl,
            c.description, c.address, c.websiteUrl, c.status, cs.name
        )
        FROM Company c
        LEFT JOIN c.subscriptions cs ON cs.isActive = true
        WHERE c.isDeleted = false
        AND c.status = CompanyStatus.PENDING
        AND (
            :cursor IS NULL OR
            c.createdAt > (SELECT c2.createdAt FROM Company c2 WHERE c2.id = :cursor) OR
            (c.createdAt = (SELECT c2.createdAt FROM Company c2 WHERE c2.id = :cursor) AND c.id > :cursor)
        )
        ORDER BY c.createdAt ASC
    """)
    List<CompanyFeedItemResponse> getCompanyFeedPending(
            @Param("cursor") String cursor,
            Pageable pageable
    );

}