package com.skillbridge.backend.controller;

import com.skillbridge.backend.dto.request.*;
import com.skillbridge.backend.dto.response.ApiResponse;
import com.skillbridge.backend.dto.response.LoginResponse;
import com.skillbridge.backend.dto.response.RegisterResponse;
import com.skillbridge.backend.entity.InvalidatedToken;
import com.skillbridge.backend.entity.User;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.repository.InvalidatedTokenRepository;
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

    @PostMapping("/register/verify-otp")
    public ResponseEntity<ApiResponse<RegisterResponse>> registerOtp(@Valid @RequestBody RegisterOtpRequest request) {
        try {
            RegisterResponse rs = authService.registerOtp(request);
            ApiResponse<RegisterResponse> response = new ApiResponse<>(
                    HttpStatus.OK.value(), "Đăng ký tài khoản thành công", rs
            );

            return ResponseEntity.ok(response);

        } catch (AppException ex) {
            System.out.println("[REGISTER] AppException occurred");
            System.out.println("[REGISTER] ErrorCode: " + ex.getErrorCode());
            throw ex;
        }
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<String>> register(@Valid @RequestBody RegisterRequest request) {
        try {
            String rs = authService.register(request);
            ApiResponse<String> response = new ApiResponse<>(
                    HttpStatus.OK.value(), "Xác thực email", rs
            );
            return ResponseEntity.ok(response);
        } catch (AppException ex) {
            System.out.println("[REGISTER] Error from AuthService:");
            System.out.println("Code: " + ex.getErrorCode());
            System.out.println("Message: " + ex.getMessage());
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

    @PostMapping("/login/verify-otp")
    public ResponseEntity<ApiResponse<LoginResponse>> verifyOtp(@Valid @RequestBody LoginRequest request) {
        try {
            LoginResponse result = authService.verifyOtp(request);

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



    @PatchMapping("/me/2fa")
    public ResponseEntity<ApiResponse<User>> toggleTwoFactor(@Valid @RequestBody TwoFactorToggleRequest request, @Valid @RequestHeader(value = "Authorization") String token) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                throw new AppException(ErrorCode.UNAUTHORIZED);
            }
            String jwt = token.substring(7);

            System.out.println("aa: " + request.isEnabled());
            User rs = authService.toggleTwoFactor(request.isEnabled(), jwt);
            ApiResponse<User> response = new ApiResponse<>(
                    HttpStatus.OK.value(), "Cập nhật 2FA", rs
            );
            return ResponseEntity.ok(response);

        } catch (AppException ex) {
            System.out.println("[TOGGLE-TWO-FACTOR] AppException occurred");
            System.out.println("[TOGGLE-TWO-FACTOR] ErrorCode: " + ex.getErrorCode());
            throw ex;
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout(@Valid @RequestHeader(value = "Authorization") String token) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                throw new AppException(ErrorCode.UNAUTHORIZED);
            }
            String jwt = token.substring(7);

            authService.logout(jwt);
            ApiResponse<String> response = new ApiResponse<>(
                    HttpStatus.OK.value(), "Đăng xuất", "Đăng xuất tài khoản thành công"
            );
            return ResponseEntity.ok(response);
        } catch (AppException ex) {
            System.out.println("[LOGOUT] AppException occurred");
            System.out.println("[LOGOUT] ErrorCode: " + ex.getErrorCode());
            throw ex;
        }
    }
}
