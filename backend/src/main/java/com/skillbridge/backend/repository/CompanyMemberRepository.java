package com.skillbridge.backend.repository;

import com.skillbridge.backend.dto.response.CompanyMemberResponse;
import com.skillbridge.backend.entity.CompanyMember;
import com.skillbridge.backend.enums.CompanyRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CompanyMemberRepository extends JpaRepository<CompanyMember, String> {


    Optional<CompanyMember> findByUser_Id(String userId);

    List<CompanyMember> findByCompany_IdAndRole(String companyId, CompanyRole role);

    Optional<CompanyMember> findByCompany_IdAndUser_Id(String companyId, String userId);

    List<CompanyMember> findByCompany_Id(String companyId);

    @Query("""
           SELECT new com.skillbridge.backend.dto.response.CompanyMemberResponse(
                cm.id,c.id,c.name,c.description,c.websiteUrl,
                r.id,cm.role,r.name,r.status,r.address,
                r.email,r.phoneNumber
           )
           FROM CompanyMember cm
           LEFT JOIN cm.company c
           LEFT JOIN cm.user r
           WHERE cm.isDeleted = false
           AND c.id IN (SELECT cm2.company.id FROM CompanyMember cm2 WHERE cm2.user.id = :userId)
           ORDER BY cm.createdAt DESC
        """
    )List<CompanyMemberResponse> getMemeber(
            @Param("userId") String userID
    );
}