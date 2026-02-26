package com.skillbridge.backend.repository;

import com.skillbridge.backend.dto.TopCompanyDTO;
import com.skillbridge.backend.dto.response.CompanyFeedItemResponse;
import com.skillbridge.backend.entity.Company;
import com.skillbridge.backend.entity.User;
import com.skillbridge.backend.enums.CompanyStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompanyRepository extends JpaRepository<Company, String> {
    @Query("""
                SELECT new com.skillbridge.backend.dto.response.CompanyFeedItemResponse(
                    c.id, c.name, c.taxId, c.businessLicenseUrl, c.imageUrl, 
                    c.description, c.address, c.websiteUrl, c.status, sp.name
                )
                FROM Company c
                LEFT JOIN CompanySubscription cs ON cs.company.id = c.id AND cs.isActive = true
                LEFT JOIN SubscriptionPlan sp ON cs.subscriptionPlan.id = sp.id
                WHERE (:status IS NULL OR c.status = :status)
                AND (:cursor IS NULL OR c.id < :cursor)
                ORDER BY c.id DESC
            """)
    List<CompanyFeedItemResponse> getCompanyFeed(
            @Param("cursor") String cursor,
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
}