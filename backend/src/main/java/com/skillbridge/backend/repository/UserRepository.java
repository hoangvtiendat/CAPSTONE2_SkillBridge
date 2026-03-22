package com.skillbridge.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.skillbridge.backend.entity.User;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String>, JpaSpecificationExecutor<User> {

    /** Tìm kiếm người dùng theo địa chỉ Email */
    Optional<User> findByEmail(String email);

    /** Tìm kiếm người dùng theo id */
    Optional<User> findById(String id);

    /** Thống kê số lượng người dùng mới gia nhập hệ thống kể từ một mốc thời gian */
    long countByCreatedAtAfter(LocalDateTime createdAtAfter);

    /** Thống kê số lượng người dùng đăng ký trong một khoảng thời gian xác định */
    long countByCreatedAtBetween(LocalDateTime createdAtAfter, LocalDateTime createdAtBefore);
}
