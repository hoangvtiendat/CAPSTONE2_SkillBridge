package com.skillbridge.backend.service;

import com.skillbridge.backend.dto.response.NotificationResponse;
import com.skillbridge.backend.entity.Notification;
import com.skillbridge.backend.entity.User;
import com.skillbridge.backend.repository.NotificationRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class NotificationService {
    NotificationRepository notificationRepository;
    SimpMessagingTemplate messagingTemplate;
    MailService mailService;

    /**
     * Hàm tạo thông báo đa kênh: Database, WebSocket và Email (tùy chọn)
     */
    @Transactional(propagation = Propagation.REQUIRED)
    public void createNotification(
            User receiver,
            String senderEmail,
            String subject,
            String message,
            String type,
            String link,
            boolean sendEmail
    ) {
        // 1. Tạo đối tượng và lưu vào Database
        Notification notification = Notification.builder()
                .user(receiver)
                .title(subject)
                .content(message)
                .isRead(false)
                .type(type)
                .link(link)
                .build();

        notificationRepository.save(notification);
        log.info("Notification saved to DB for user: {}", receiver.getId());

        // 2. Bắn thông báo Real-time (WebSocket)
        try {
            messagingTemplate.convertAndSendToUser(
                    receiver.getId(),
                    "/queue/notifications",
                    notification
            );
            log.info("WebSocket dispatched to user: {}", receiver.getId());
        } catch (Exception e) {
            log.error("WebSocket failed for user {}: {}", receiver.getId(), e.getMessage());
        }

        // 3. Gửi Email (Nếu tham số sendEmail là true)
        if (sendEmail) {
            try {
                // Sử dụng hàm mailService
                mailService.sendToEmail(senderEmail, receiver.getEmail(), subject, message);
                log.info("Email queued for user: {}", receiver.getEmail());
            } catch (Exception e) {
                log.error("Email dispatch failed for user {}: {}", receiver.getEmail(), e.getMessage());
            }
        }
    }

    public List<NotificationResponse> getNotificationsForUser(String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public void markAsRead(String notificationId) {
        notificationRepository.findById(notificationId).ifPresent(notification -> {
            notification.setRead(true);
            notificationRepository.save(notification);
        });
    }

    @Transactional
    public void markAllAsRead(String userId) {
        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        notifications.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(notifications);
    }

    private NotificationResponse mapToResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .title(notification.getTitle())
                .content(notification.getContent())
                .isRead(notification.isRead())
                .type(notification.getType())
                .link(notification.getLink())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}