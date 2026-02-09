package com.skillbridge.backend.service;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {
    private final Map<String, String> otpStore = new ConcurrentHashMap<>();
    private final Map<String, Long> otpExpire = new ConcurrentHashMap<>();

    private static final long OTP_TTL = 3 * 60 * 1000; //thời hạn 180s

    private final MailService mailService;

    public OtpService(MailService mailService) {
        this.mailService = mailService;
    }

    public String generateOtp(String email) {
        String otp = String.valueOf((int) (Math.random() * 900000) + 100000);
        otpStore.put(email, otp);
        otpExpire.put(email, System.currentTimeMillis() + OTP_TTL);
        return otp;
    }

    public void sendOtpEmail(String email, String subject, String content) {
        mailService.sendToEmail(
                email,
                subject,
                content
        );
    }

    public boolean verifyOtp(String email, String otp) {
        try {
            if (!otpStore.containsKey(email)) {
                return false;
            }
            long expireTime = otpExpire.get(email);
            if (System.currentTimeMillis() > expireTime) {
                otpStore.remove(email);
                otpExpire.remove(email);
                return false;
            }

            return otpStore.get(email).equals(otp);
//            boolean valid = otpStore.get(email).equals(otp);
//            if (valid) {
//                otpStore.remove(email);
//                otpExpire.remove(email);
//            }
//            return valid;
        } catch (Exception e) {
            System.out.println("Catch: " + e.getMessage());
            return false;
        }
    }

    public void consumeOtp(String email) {
        otpStore.remove(email);
        otpExpire.remove(email);
    }
}
