package com.skillbridge.backend.repository;

import com.skillbridge.backend.dto.response.CompanyFeedItemResponse;
import com.skillbridge.backend.entity.Company;
import com.skillbridge.backend.enums.CompanyStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CompanyRepository extends JpaRepository<Company, String> {

    @Query("""
        SELECT new com.skillbridge.backend.dto.response.CompanyFeedItemResponse(
            c.id, c.name, c.taxId, c.gpkdUrl, c.imageUrl, 
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
}