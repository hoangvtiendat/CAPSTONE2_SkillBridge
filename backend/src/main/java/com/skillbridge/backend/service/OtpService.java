package com.skillbridge.backend.service;

import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.utils.OtpUtils;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OtpService {

    MailService mailService;
    SystemLogService systemLog;
    SimpMessagingTemplate messagingTemplate;

    Map<String, OtpData> otpStorage = new ConcurrentHashMap<>();

    // Thời gian sống của OTP (3 phút)
    static long OTP_TTL = 3 * 60 * 1000;

    /**
     * Đối tượng lưu trữ nội bộ để đóng gói dữ liệu OTP
     */
    @Getter
    @Builder
    static class OtpData {
        String code;
        long expiryTime;
    }

    /**
     * Tạo OTP và lưu vào bộ nhớ tạm
     */
    public String generateOtp(String email) {
        String otpCode = OtpUtils.generateRandomOtp();

        OtpData data = OtpData.builder()
                .code(otpCode)
                .expiryTime(System.currentTimeMillis() + OTP_TTL)
                .build();

        otpStorage.put(email, data);

        log.info("OTP generated for email: {}", email);
        return otpCode;
    }

    /**
     * Gửi OTP qua Email và ghi Log hệ thống
     */
    public void sendOtpEmail(String email, String subject, String content) {
        mailService.sendToEmail(null, email, subject, content);

        // Ghi log hệ thống (currentUser = null vì user chưa login)
        systemLog.info(null, "Hệ thống gửi mã OTP xác thực đến email: " + email);

        // Realtime: Thông báo cho Admin biết có hoạt động gửi mã xác thực
        messagingTemplate.convertAndSend("/topic/logs", "OTP_SENT:" + email);
    }

    /**
     * Xác thực mã OTP
     */
    public boolean verifyOtp(String email, String otp) {
        OtpData data = otpStorage.get(email);

        if (data == null) {
            return false;
        }

        // Kiểm tra hết hạn
        if (System.currentTimeMillis() > data.getExpiryTime()) {
            consumeOtp(email);
            return false;
        }

        return data.getCode().equals(otp);
    }

    /**
     * Hủy bỏ OTP sau khi sử dụng thành công
     */
    public void consumeOtp(String email) {
        otpStorage.remove(email);
    }

    /**
     * Kiểm tra xem Email có đang trong quá trình chờ OTP không
     */
    public boolean isWaitingForOtp(String email) {
        return otpStorage.containsKey(email) &&
                System.currentTimeMillis() < otpStorage.get(email).getExpiryTime();
    }
}