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

    public List<SystemLog> getLogs(String cursor, int limit, String level) {
        try {
            Pageable pageable = PageRequest.of(0, limit + 1);

            List<SystemLog> logs = systemLogRepository.getLogs(level, cursor, pageable);

            System.out.println("Truy vấn thành công. Số lượng bản ghi lấy được: " + logs.size());

            if (logs.isEmpty()) {
                System.out.println("Không tìm thấy log nào phù hợp.");
            } else {
                System.out.println("ID bản ghi đầu tiên: " + logs.get(0).getId());
                System.out.println("ID bản ghi cuối cùng: " + logs.get(logs.size() - 1).getId());
            }

            return logs;

        } catch (Exception e) {
            System.err.println("LỖI" + e.getMessage());
            e.printStackTrace();
            return List.of();
        } finally {
            System.out.println("=".repeat(50) + "\n");
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

            messagingTemplate.convertAndSend("/topic/logs", savedLog);

            String operator = (userDetails != null) ? userDetails.getUsername() : "System";
            System.out.println("LOG: " + action + " | Thực hiện bởi: " + operator);

        } catch (Exception e) {
            System.err.println("Không thể ghi System Log! Chi tiết: " + e.getMessage());
        }
    }
}
