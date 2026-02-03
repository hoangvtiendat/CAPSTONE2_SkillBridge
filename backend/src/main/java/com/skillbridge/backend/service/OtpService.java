package com.skillbridge.backend.service;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {
    private final Map<String,String> otpStore = new ConcurrentHashMap<>();
    private final Map<String, Long> otpExpire = new ConcurrentHashMap<>();

    private static final long OTP_TTL = 3*60*1000; //thời hạn 180s

    private final MailService mailService;

    public OtpService(MailService mailService) {
        this.mailService = mailService;
    }

    public String generateOtp(String email){
        String otp = String.valueOf((int)(Math.random()*900000)+100000);
        otpStore.put(email,otp);
        otpExpire.put(email,System.currentTimeMillis() + OTP_TTL);
        return otp;
    }

    public void sendOtpEmail(String email) {
        String otp = generateOtp(email);

        mailService.sendToEmail(
                email,
                "Mã xác thực đăng nhập",
                "OTP của bạn là: " + otp + "\nCó hiệu lực trong 3 phút."
        );
    }

    public boolean verifyOtp(String email, String otp){
        if(!otpStore.containsKey(email)){
            return false;
        }
        long expireTime = otpExpire.get(email);
        if(System.currentTimeMillis()>expireTime){
            otpStore.remove(email);
            otpExpire.remove(email);
            return false;
        }

        boolean valid = otpStore.get(email).equals(otp);
        if(valid){
            otpStore.remove(email);
            otpExpire.remove(email);
        }
        return valid;
    }
}
