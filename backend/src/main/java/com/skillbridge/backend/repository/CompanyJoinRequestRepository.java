package com.skillbridge.backend.repository;

import com.skillbridge.backend.dto.response.CompanyFeedItemResponse;
import com.skillbridge.backend.dto.response.CompanyMemberResponse;
import com.skillbridge.backend.enums.CompanyStatus;
import com.skillbridge.backend.enums.JoinRequestStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import com.skillbridge.backend.entity.CompanyJoinRequest;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CompanyJoinRequestRepository extends JpaRepository<CompanyJoinRequest, String> {
    Optional<CompanyJoinRequest> findByCompany_IdAndUser_IdAndStatus(
            String companyId,
            String userId,
            JoinRequestStatus status
    );

    @Query("""
        SELECT new com.skillbridge.backend.dto.response.CompanyMemberResponse(
            cjr.id, c.id, c.name, c.description, c.websiteUrl,
            u.id, null, u.name, u.status, u.address,
            u.email, u.phoneNumber
        )
        FROM CompanyJoinRequest cjr
        JOIN cjr.company c
        JOIN cjr.user u
        JOIN CompanyMember cm ON cm.company.id = c.id
        WHERE cjr.status = JoinRequestStatus.PENDING
        AND cm.user.id = :userId
        ORDER BY cjr.createdAt ASC
    """)
    List<CompanyMemberResponse> getJoinRequestOfMyCompany(@Param("userId") String userId);
}
