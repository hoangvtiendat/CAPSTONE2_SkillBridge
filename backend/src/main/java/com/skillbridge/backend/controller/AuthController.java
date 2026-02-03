package com.skillbridge.backend.controller;

import com.skillbridge.backend.dto.request.LoginRequest;
import com.skillbridge.backend.dto.response.ApiResponse;
import com.skillbridge.backend.dto.response.LoginResponse;
import com.skillbridge.backend.dto.request.RegisterRequest;
import com.skillbridge.backend.dto.response.RegisterResponse;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import com.skillbridge.backend.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.converter.json.GsonBuilderUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


@RestController
@RequestMapping("/auth")
public class AuthController {
    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private AuthService authService;

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

            ApiResponse<LoginResponse> response = new ApiResponse<>(
                    HttpStatus.OK.value(), "Đăng nhập thành công", result
            );

            return ResponseEntity.ok(response);

        } catch (AppException ex) {
            System.out.println("[LOGIN] AppException occurred");
            System.out.println("[LOGIN] ErrorCode: " + ex.getErrorCode());
            throw ex;
        }
    }
}
