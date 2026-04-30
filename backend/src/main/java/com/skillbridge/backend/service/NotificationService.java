package com.skillbridge.backend.service;

import com.skillbridge.backend.dto.response.NotificationResponse;
import com.skillbridge.backend.entity.Job;
import com.skillbridge.backend.entity.Notification;
import com.skillbridge.backend.entity.NotificationForAI; // Bây giờ nó đóng vai trò là DTO
import com.skillbridge.backend.entity.User;
import com.skillbridge.backend.enums.JobStatus;
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
     * Hàm tạo thông báo cho người dùng (Quả chuông 🔔)
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
        Notification notification = Notification.builder()
                .user(receiver)
                .title(subject)
                .content(message)
                .read(false)
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
                    mapToResponse(notification)
            );
            log.info("WebSocket dispatched to user: {}", receiver.getId());
        } catch (Exception e) {
            log.error("WebSocket failed for user {}: {}", receiver.getId(), e.getMessage());
        }

        // 3. Gửi Email
        if (sendEmail) {
            try {
                mailService.sendToEmail(senderEmail, receiver.getEmail(), subject, message);
                log.info("Email queued for user: {}", receiver.getEmail());
            } catch (Exception e) {
                log.error("Email dispatch failed for user {}: {}", receiver.getEmail(), e.getMessage());
            }
        }
    }

    /**
     * Hàm bắn tín hiệu ngầm cho hệ thống UI đổi trạng thái (Không lưu DB)
     */
    public void notificationForAiCheckTrafficLight(
            User receiver,
            String senderEmail,
            String OBJ_id,
            JobStatus jobStatus,
            String title,
            String message,
            boolean sendEmail,
            String action
    ){
        NotificationForAI notificationForAI = NotificationForAI.builder()
                .userId(receiver.getId())
                .title(title)
                .objId(OBJ_id)
                .status(jobStatus)
                .message(message)
                .action(action)
                .build();


        try {
            messagingTemplate.convertAndSendToUser(
                    receiver.getId(),
                    "/queue/Notification_JD",
                    notificationForAI
            );
            log.info("Notification for AI traffic light sent via WebSocket for user: {}", receiver.getId());
        } catch (Exception e) {
            log.error("Lỗi khi gửi tín hiệu UI: {}", e.getMessage());
        }

        if (sendEmail) {
            try {
                mailService.sendToEmail(senderEmail, receiver.getEmail(), title, message);
            } catch (Exception e) {
                log.error("Lỗi khi gửi email AI update: {}", e.getMessage());
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

    public NotificationResponse mapToResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .title(notification.getTitle())
                .content(notification.getContent())
                .read(notification.isRead())
                .type(notification.getType())
                .link(notification.getLink())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}