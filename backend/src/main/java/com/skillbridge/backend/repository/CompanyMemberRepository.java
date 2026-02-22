package com.skillbridge.backend.repository;

import com.skillbridge.backend.entity.CompanyMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CompanyMemberRepository extends JpaRepository<CompanyMember, String> {


    Optional<CompanyMember> findByUser_Id(String userId);

}