package com.skillbridge.backend.repository;

import com.skillbridge.backend.dto.response.CompanyMemberResponse;
import com.skillbridge.backend.entity.CompanyMember;
import com.skillbridge.backend.enums.CompanyRole;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompanyMemberRepository extends JpaRepository<CompanyMember, String> {

    /** Tìm kiếm thông tin thành viên dựa trên ID người dùng */
    @EntityGraph(attributePaths = {"company"})
    Optional<CompanyMember> findByUser_Id(String userId);

    /** Lấy danh sách toàn bộ thành viên của một công ty cụ thể */
    @EntityGraph(attributePaths = {"user"})
    List<CompanyMember> findByCompany_Id(String companyId);

    /** Tìm kiếm một bản ghi thành viên dựa trên sự kết hợp giữa ID công ty và ID người dùng */
    @EntityGraph(attributePaths = {"company", "user"})
    Optional<CompanyMember> findByCompany_IdAndUser_Id(String companyId, String userId);

    /** Lọc danh sách thành viên theo vai trò cụ thể trong một công ty (ví dụ: Tìm tất cả ADMIN) */
    List<CompanyMember> findByCompany_IdAndRole(String companyId, CompanyRole role);

    /** Lấy danh sách thành viên của công ty mà người dùng hiện tại đang tham gia */
    @Query("""
           SELECT new com.skillbridge.backend.dto.response.CompanyMemberResponse(
                cm.id, c.id, c.name, c.description, c.websiteUrl,
                u.id, cm.role, u.name, u.status, u.address,
                u.email, u.phoneNumber
           )
           FROM CompanyMember cm
           JOIN cm.company c
           JOIN cm.user u
           WHERE cm.isDeleted = false
           AND c.id = (SELECT cm2.company.id FROM CompanyMember cm2 WHERE cm2.user.id = :userId)
           ORDER BY cm.createdAt DESC
        """
    )
    List<CompanyMemberResponse> getMembers(@Param("userId") String userId);
}