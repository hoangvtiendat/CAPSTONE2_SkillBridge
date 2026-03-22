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
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompanyJoinRequestRepository extends JpaRepository<CompanyJoinRequest, String> {

    /** Tìm kiếm một yêu cầu cụ thể dựa trên công ty, người dùng và trạng thái */
    Optional<CompanyJoinRequest> findByCompany_IdAndUser_IdAndStatus(
            String companyId,
            String userId,
            JoinRequestStatus status
    );

    /** Lấy danh sách các yêu cầu đang chờ xử lý (PENDING) của công ty mà User hiện tại đang làm Admin */
    @Query("""
        SELECT new com.skillbridge.backend.dto.response.CompanyMemberResponse(
            cjr.id, c.id, c.name, c.description, c.websiteUrl,
            u.id, null, u.name, u.status, u.address,
            u.email, u.phoneNumber
        )
        FROM CompanyJoinRequest cjr
        JOIN cjr.company c
        JOIN cjr.user u
        WHERE cjr.isDeleted = false
        AND cjr.status = JoinRequestStatus.PENDING
        AND c.id IN (
            SELECT cm.company.id
            FROM CompanyMember cm
            WHERE cm.user.id = :userId
            AND cm.role = CompanyRole.ADMIN
        )
        ORDER BY cjr.createdAt ASC
    """)
    List<CompanyMemberResponse> getJoinRequestOfMyCompany(
            @Param("userId") String userId)
    ;
}
