package com.skillbridge.backend.controller;

import com.skillbridge.backend.dto.response.ApiResponse;
import com.skillbridge.backend.dto.response.SystemStatsResponse;
import com.skillbridge.backend.entity.User;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin")
public class AdminController {
    private final AdminService adminService;

    @GetMapping("/stats/overview")
    public ResponseEntity<ApiResponse<SystemStatsResponse>> statsOverview(@Valid @RequestHeader(value = "Authorization") String token) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                throw new AppException(ErrorCode.UNAUTHORIZED);
            }
            String jwt = token.substring(7);
            SystemStatsResponse rs = adminService.statsOverview(jwt);
            ApiResponse<SystemStatsResponse> response = new ApiResponse<>(
                    HttpStatus.OK.value(), "Thống kê hệ thống", rs
            );
            return ResponseEntity.ok(response);
        } catch (AppException ex) {
            System.out.println("[STATS OVERVIEW] AppException occurred");
            System.out.println("[STATS OVERVIEW] ErrorCode: " + ex.getErrorCode());
            throw ex;
        }
    }
}
