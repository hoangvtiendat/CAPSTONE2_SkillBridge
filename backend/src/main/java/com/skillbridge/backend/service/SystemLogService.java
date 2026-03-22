package com.skillbridge.backend.service;

import com.skillbridge.backend.config.CustomUserDetails;
import com.skillbridge.backend.dto.response.CursorResponse;
import com.skillbridge.backend.entity.SystemLog;
import com.skillbridge.backend.entity.User;
import com.skillbridge.backend.enums.LogLevel;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.repository.SystemLogRepository;
import com.skillbridge.backend.repository.UserRepository;
import com.skillbridge.backend.utils.DataParserUtils;
import com.skillbridge.backend.utils.IpUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import jakarta.servlet.http.HttpServletRequest;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SystemLogService {
    SystemLogRepository systemLogRepository;
    UserRepository userRepository;
    SimpMessagingTemplate messagingTemplate;
    DataParserUtils dataParserUtils;
    HttpServletRequest request;
    IpUtils ipUtils;

    /**
     * Lấy danh sách Log theo cơ chế Cursor (ID của bản ghi cuối cùng)
     */
    public CursorResponse<SystemLog> getLogs(String cursor, int limit, String level, String date) {
        try {
            Pageable pageable = PageRequest.of(0, limit + 1);

            LogLevel levelEnum = dataParserUtils.parseEnum(LogLevel.class, level);
            LocalDate localDate = dataParserUtils.parseLocalDate(date);

            LocalDateTime start = (localDate != null) ? localDate.atStartOfDay() : null;
            LocalDateTime end = (localDate != null) ? localDate.atTime(LocalTime.MAX) : null;

            List<SystemLog> rawLogs = systemLogRepository.getLogs(
                    levelEnum, start, end, null, cursor, pageable
            );

            List<SystemLog> logs = new ArrayList<>(rawLogs != null ? rawLogs : List.of());

            boolean hasNext = logs.size() > limit;
            String nextCursor = null;

            if (hasNext) {
                logs.remove(limit);
                nextCursor = logs.get(logs.size() - 1).getId();
            }

            return new CursorResponse<>(logs, nextCursor, hasNext);

        } catch (Exception e) {
            log.error("Error fetching logs: {}", e.getMessage());
            throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Ghi log hành động mới (Transactional độc lập)
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAction(CustomUserDetails userDetails, String action, LogLevel level) {
        try {
            SystemLog sysLog = new SystemLog();

            if (userDetails != null && userDetails.getUserId() != null) {
                userRepository.findById(userDetails.getUserId()).ifPresent(sysLog::setUser);
            }
            String ipAddress = ipUtils.getClientIp(request);
            sysLog.setIpAddress(ipAddress);

            sysLog.setAction(action);
            sysLog.setLogLevel(level);

            SystemLog savedLog = systemLogRepository.save(sysLog);

            messagingTemplate.convertAndSend("/topic/logs", savedLog);

        } catch (Exception e) {
            log.error("Failed to save action log: {}", e.getMessage());
        }
    }

    /**
     * Ghi log mức độ INFO (Thông tin thông thường)
     */
    public void info(CustomUserDetails user, String action) {
        logAction(user, action, LogLevel.INFO);
    }

    /**
     * Ghi log mức độ WARNING (Cảnh báo hành động nhạy cảm)
     */
    public void warn(CustomUserDetails user, String action) {
        logAction(user, action, LogLevel.WARNING);
    }

    /**
     * Ghi log mức độ DANGER (Lỗi hệ thống hoặc hành động nguy hiểm)
     */
    public void danger(CustomUserDetails user, String action) {
        logAction(user, action, LogLevel.DANGER);
    }
}