package com.skillbridge.backend.controller;

import com.skillbridge.backend.dto.request.LoginRequest;
//import com.skillbridge.backend.dto.request.LoginResponse;
import com.skillbridge.backend.dto.response.ApiResponse;
import com.skillbridge.backend.dto.response.LoginResponse;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import com.skillbridge.backend.entity.User;
import com.skillbridge.backend.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {
    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request
    ) {
        System.out.println("[LOGIN] Request received");
        System.out.println("[LOGIN] Email: " + request.getEmail());

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

        } catch (Exception ex) {
            System.out.println("[LOGIN] Unexpected error occurred");
            ex.printStackTrace();
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }
}
