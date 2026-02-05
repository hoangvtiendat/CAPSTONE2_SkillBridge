package com.skillbridge.backend.controller;

import com.skillbridge.backend.dto.request.ForgotPasswordRequest;
import com.skillbridge.backend.dto.request.LoginRequest;
import com.skillbridge.backend.dto.request.ResetPasswordRequest;
import com.skillbridge.backend.dto.response.ApiResponse;
import com.skillbridge.backend.dto.response.LoginResponse;
import com.skillbridge.backend.dto.request.RegisterRequest;
import com.skillbridge.backend.dto.response.RegisterResponse;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.service.OtpService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import com.skillbridge.backend.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


@RestController
@RequestMapping("/auth")
public class AuthController {
    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private AuthService authService;
    private OtpService otpService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<RegisterResponse>> register(@Valid @RequestBody RegisterRequest request) {
        try {
            RegisterResponse rs = authService.register(request);
            System.out.println("rs: " + rs.toString());
            ApiResponse<RegisterResponse> response = new ApiResponse<>(
                    HttpStatus.OK.value(), "Đăng ký thành công", rs
            );
            return ResponseEntity.ok(response);
        } catch (AppException ex) {
//            System.out.println("[REGISTER] Error from AuthService:");
//            System.out.println("Code: " + ex.getErrorCode());
//            System.out.println("Message: " + ex.getMessage());
            log.error("Register failed. Email={}", request.getEmail(), ex);
            throw ex;
        }
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        try {
            LoginResponse result = authService.login(request);

            if (result == null) {
                System.out.println("[LOGIN] Login failed: invalid email or password");
                throw new AppException(ErrorCode.UNAUTHORIZED);
            }
            System.out.println("[LOGIN] Login success");

            String message = "Đăng nhập thành công";
            if (String.valueOf(result.getIs2faEnabled()) == "1") {
                message = "Mã xác thực 2 lớp đã được gửi về email " + request.getEmail();
            }
            ApiResponse<LoginResponse> response = new ApiResponse<>(
                    HttpStatus.OK.value(), message, result
            );

            return ResponseEntity.ok(response);

        } catch (AppException ex) {
            System.out.println("[LOGIN] AppException occurred");
            System.out.println("[LOGIN] ErrorCode: " + ex.getErrorCode());
            throw ex;
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<LoginResponse>> verifyOtp(@Valid @RequestBody LoginRequest request) {
        try {
            System.out.println(1);
            LoginResponse result = authService.verifyOtp(request);
            System.out.println(2);
            ApiResponse<LoginResponse> response = new ApiResponse<>(
                    HttpStatus.OK.value(), "Mã OTP Đúng", result
            );
            return ResponseEntity.ok(response);
        } catch (AppException ex) {
            System.out.println("[VERIFY-OTP] AppException occurred");
            System.out.println("[VERIFY-OTP] ErrorCode: " + ex.getErrorCode());
            throw ex;
        }

    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            String rs = authService.forgotPassword(request);
            ApiResponse<String> response = new ApiResponse<>(
                    HttpStatus.OK.value(), "Mã OTP đã được gửi về gmail của bạn", rs
            );
            return ResponseEntity.ok(response);
        } catch (AppException ex) {
            System.out.println("[FORGOT PASSWORD] AppException occurred");
            System.out.println("[FORGOT PASSWORD] ErrorCode: " + ex.getErrorCode());
            throw ex;
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<LoginResponse>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            LoginResponse rs = authService.resetPassword(request);
            ApiResponse<LoginResponse> response = new ApiResponse<>(
                    HttpStatus.OK.value(), "Đổi mật khẩu thành công", rs
            );
            return ResponseEntity.ok(response);
        } catch (AppException ex) {
            System.out.println("[FORGOT PASSWORD] AppException occurred");
            System.out.println("[FORGOT PASSWORD] ErrorCode: " + ex.getErrorCode());
            throw ex;
        }
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<>>
}
