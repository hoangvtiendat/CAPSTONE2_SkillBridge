package com.skillbridge.backend.repository;

import com.skillbridge.backend.dto.TopCompanyDTO;
import com.skillbridge.backend.dto.response.CompanyFeedItemResponse;
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

    @Query("""
        SELECT new com.skillbridge.backend.dto.response.CompanyFeedItemResponse(
            c.id, c.name, c.taxId, c.businessLicenseUrl, c.imageUrl, 
            c.description, c.address, c.websiteUrl, c.status, sp.name
        )
        FROM Company c
        LEFT JOIN c.subscriptions cs ON cs.isActive = true
        LEFT JOIN cs.subscriptionPlan sp
        WHERE (:status IS NULL OR c.status = :status) 
        AND c.isDeleted = false
        ORDER BY c.createdAt DESC
    """)
    Page<CompanyFeedItemResponse> getCompanyFeed(
            @Param("status") CompanyStatus status,
            Pageable pageable
    );

    Optional<Company> findCompaniesByTaxId(String taxId);

    long countByStatus(CompanyStatus status);

    @Query("""
                SELECT new com.skillbridge.backend.dto.TopCompanyDTO(
                    c.id,
                    c.name,
                    COUNT(j)
                )
                FROM Company c
                LEFT JOIN Job j ON j.company.id = c.id
                GROUP BY c.id, c.name
                ORDER BY COUNT(j) DESC
            """)
    List<TopCompanyDTO> findTop5ByJobCount(Pageable pageable);

    long countByCreatedAtAfter(LocalDateTime createdAtAfter);

    long countByCreatedAtBetween(LocalDateTime createdAtAfter, LocalDateTime createdAtBefore);
}