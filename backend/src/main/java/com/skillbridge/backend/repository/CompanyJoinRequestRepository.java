package com.skillbridge.backend.repository;

import com.skillbridge.backend.enums.JoinRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import com.skillbridge.backend.entity.CompanyJoinRequest;

import java.util.Optional;

public interface CompanyJoinRequestRepository extends JpaRepository<CompanyJoinRequest, String> {
    Optional<CompanyJoinRequest> findByCompany_IdAndUser_IdAndStatus(
            String companyId,
            String userId,
            JoinRequestStatus status
    );
}
