package com.skillbridge.backend.service;

import com.skillbridge.backend.config.CustomUserDetails;
import com.skillbridge.backend.entity.SystemLog;
import com.skillbridge.backend.entity.User;
import com.skillbridge.backend.enums.LogLevel;
import com.skillbridge.backend.repository.SystemLogRepository;
import com.skillbridge.backend.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SystemLogService {

    private final SystemLogRepository systemLogRepository;
    private final UserRepository userRepository;

    public SystemLogService(
            SystemLogRepository systemLogRepository,
            UserRepository userRepository
    ) {
        this.systemLogRepository = systemLogRepository;
        this.userRepository = userRepository;
    }

    public List<SystemLog> getAllLogs(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return systemLogRepository.findAllByOrderByCreatedAtDesc(pageable);
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
            systemLogRepository.save(log);

            String operator = (userDetails != null) ? userDetails.getUsername() : "System";
            System.out.println("LOG: " + action + " | Thực hiện bởi: " + operator);

        } catch (Exception e) {
            System.err.println("Không thể ghi System Log! Chi tiết: " + e.getMessage());
        }
    }
}
