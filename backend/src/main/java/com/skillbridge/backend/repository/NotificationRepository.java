package com.skillbridge.backend.repository;

import com.skillbridge.backend.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, String> {
    /** Lấy danh sách thông báo của một người dùng, sắp xếp theo thời gian mới nhất trước */
    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId);

    /** Đếm số lượng thông báo chưa đọc của một người dùng cụ thể */
    long countByUserIdAndReadFalse(String userId);
}