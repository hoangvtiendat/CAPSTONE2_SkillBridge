package com.skillbridge.backend.repository;

import com.skillbridge.backend.entity.Company;
import com.skillbridge.backend.entity.CompanyMember;
import com.skillbridge.backend.enums.CompanyRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface companyMemberRepository extends JpaRepository<CompanyMember, String> {
    List<CompanyMember> findByCompany_IdAndRole(String companyId, CompanyRole role);

    Optional<CompanyMember> findByCompany_IdAndUser_Id(
            String companyId,
            String userId
    );
}
