package com.skillbridge.backend.utils;

import java.util.Random;

public class OtpUtils {
    private static final Random RANDOM = new Random();

    /**
     * Tạo mã OTP ngẫu nhiên gồm 6 chữ số
     */
    public static String generateRandomOtp() {
        int number = 100000 + RANDOM.nextInt(900000);
        return String.valueOf(number);
    }
}