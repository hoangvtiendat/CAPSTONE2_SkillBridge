package com.skillbridge.backend.service;

import com.skillbridge.backend.config.CustomUserDetails;
import com.skillbridge.backend.entity.SystemLog;
import com.skillbridge.backend.entity.User;
import com.skillbridge.backend.enums.LogLevel;
import com.skillbridge.backend.repository.SystemLogRepository;
import com.skillbridge.backend.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SystemLogService {

    private final SystemLogRepository systemLogRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public SystemLogService(
            SystemLogRepository systemLogRepository,
            UserRepository userRepository,
            SimpMessagingTemplate messagingTemplate
    ) {
        this.systemLogRepository = systemLogRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
    }

    public List<SystemLog> getLogs(String cursor, int limit, String level, String date) {
        System.out.println("\n" + "=".repeat(20) + " NHẬN REQUEST TRUY VẤN LOG " + "=".repeat(20));
        System.out.println("-> Tham số đầu vào:");
        System.out.println("   [Cursor]: " + (cursor == null ? "NULL (Lấy mới nhất)" : cursor));
        System.out.println("   [Limit] : " + limit);
        System.out.println("   [Level] : " + level);
        System.out.println("   [Date]  : " + date);

        try {
            Pageable pageable = PageRequest.of(0, limit + 1);

            LogLevel levelEnum = null;
            if (level != null && !level.trim().isEmpty()) {
                try {
                    levelEnum = LogLevel.valueOf(level.toUpperCase().trim());
                } catch (IllegalArgumentException e) {
                    System.out.println("!! Cảnh báo: Level '" + level + "' không hợp lệ, chuyển về ALL.");
                }
            }
            String cleanDate = null;
            if (date != null && !date.trim().isEmpty() &&
                    !date.equalsIgnoreCase("null") &&
                    !date.equalsIgnoreCase("undefined")) {
                cleanDate = date.trim();
            }

            // Gọi Repository
            List<SystemLog> logs = systemLogRepository.getLogs(levelEnum, cursor, cleanDate, pageable);

            System.out.println("-> Kết quả truy vấn DB:");
            System.out.println("   [Số lượng thực tế trả về]: " + logs.size());

            if (!logs.isEmpty()) {
                System.out.println("   [Bản ghi ĐẦU (Mới nhất)]: ID=" + logs.get(0).getId() + " | Time=" + logs.get(0).getCreatedAt());
                System.out.println("   [Bản ghi CUỐI (Cũ nhất) ]: ID=" + logs.get(logs.size() - 1).getId());

                // Kiểm tra logic hasMore cho bạn
                if (logs.size() > limit) {
                    System.out.println("   [Trạng thái]: CÒN dữ liệu để cuộn (hasMore = true)");
                } else {
                    System.out.println("   [Trạng thái]: ĐÃ HẾT dữ liệu (hasMore = false)");
                }
            } else {
                System.out.println("   [Trạng thái]: Trống rỗng (Không có dữ liệu khớp bộ lọc)");
            }

            return logs;

        } catch (Exception e) {
            System.err.println("!!! LỖI TRUY VẤN: " + e.getMessage());
            e.printStackTrace();
            return List.of();
        } finally {
            System.out.println("=".repeat(60) + "\n");
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAction(CustomUserDetails userDetails, String action, LogLevel level) {
        try {
            SystemLog log = new SystemLog();
            if (userDetails != null && userDetails.getUserId() != null) {
                User userProxy = userRepository.getReferenceById(userDetails.getUserId());
                log.setUser(userProxy);
            }

            log.setAction(action);
            log.setLogLevel(level);

            SystemLog savedLog = systemLogRepository.save(log);

            // Bắn qua WebSocket
            messagingTemplate.convertAndSend("/topic/logs", savedLog);

            String operator = (userDetails != null) ? userDetails.getUsername() : "System";
            System.out.println(">>> [WS SEND]: " + action + " | Level: " + level + " | By: " + operator);

        } catch (Exception e) {
            System.err.println("!!! LỖI GHI LOG: " + e.getMessage());
        }
    }
}
