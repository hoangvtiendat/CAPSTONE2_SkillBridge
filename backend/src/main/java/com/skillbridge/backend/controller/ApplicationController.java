package com.skillbridge.backend.controller;

import com.skillbridge.backend.dto.request.RespondToApplicationRequest;
import com.skillbridge.backend.dto.response.ApiResponse;
import com.skillbridge.backend.entity.Application;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.service.ApplicationService;
import com.skillbridge.backend.service.JobService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


import java.util.List;

@RestController
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
@RequestMapping("/applications")
public class ApplicationController {
    ApplicationService applicationService;
    JobService jobService;

    /**
     * Lấy thông tin chi tiết một đơn ứng tuyển
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Application>> getApplicationById(
            @PathVariable String id,
            @Valid @RequestHeader(value = "Authorization") String token
    ) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                throw new AppException(ErrorCode.UNAUTHORIZED);
            }
            String jwt = token.substring(7);
            Application rs = applicationService.getApplicationById(id, jwt);

            ApiResponse<Application> response = new ApiResponse<>(
                    HttpStatus.OK.value(), "Lấy đơn ứng tuyển thành công", rs
            );
            return ResponseEntity.ok(response);
        } catch (AppException ex) {
            System.out.println("[GET APPLICATION BY ID] AppException occurred");
            System.out.println("[GET APPLICATION BY ID] ErrorCode: " + ex.getErrorCode());
            throw ex;
        }
    }

    /**
     * Lấy danh sách các đơn ứng tuyển theo ID của tin tuyển dụng
     */
    @GetMapping("/job/{jobId}")
    public ResponseEntity<ApiResponse<List<Application>>> getApplicationByJobId(
            @PathVariable String jobId
    ) {
        try {
            List<Application> rs = applicationService.getApplicationByJobId(jobId);
            ApiResponse<List<Application>> response = new ApiResponse<>(
                    HttpStatus.OK.value(), "Lấy đơn ứng tuyển theo tin tuyển dụng thành công", rs
            );
            return ResponseEntity.ok(response);
        } catch (AppException ex) {
            System.out.println("[GET APPLICATION BY COMPANY ID] AppException occurred");
            System.out.println("[GET APPLICATION BY COMPANY ID] ErrorCode: " + ex.getErrorCode());
            throw ex;
        }
    }

    /**
     * Nhà tuyển dụng phản hồi đơn ứng tuyển (Chấp nhận/Từ chối)
     */
    @PostMapping("/{id}/respond")
    public ResponseEntity<ApiResponse<String>> respondToApplication(
            @PathVariable String id,
            @Valid @RequestHeader(value = "Authorization") String token,
            @RequestBody RespondToApplicationRequest request
    ) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                throw new AppException(ErrorCode.UNAUTHORIZED);
            }
            String jwt = token.substring(7);
            String rs = applicationService.respondToApplication(id, request);
            ApiResponse<String> response = new ApiResponse<>(
                    HttpStatus.OK.value(), "Phản hồi đơn ứng tuyển thành công", rs
            );
            return ResponseEntity.ok(response);
        } catch (AppException ex) {
            System.out.println("[RESPOND APPLICATION] AppException occurred");
            System.out.println("[RESPOND APPLICATION] ErrorCode: " + ex.getErrorCode());
            throw ex;
        }
    }

    @GetMapping("/JD/Check-apply/{id}")
    public Boolean checkApply(@PathVariable String id) {
        Boolean result;
        try {
            result = jobService.checkUngVien(id);
            return result;
        } catch (AppException ex) {
            System.out.println("[CHECK-APPLY] AppException occurred");
        }
        return null;
    }

    @PostMapping("/{id}/withdraw")
    public ResponseEntity<ApiResponse<String>> withDrawApplication(
            @PathVariable String id,
            @Valid @RequestHeader(value = "Authorization") String token
    ) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                throw new AppException(ErrorCode.UNAUTHORIZED);
            }
            String jwt = token.substring(7);
            String rs = applicationService.withDrawApplication(id);
            ApiResponse<String> response = new ApiResponse<>(
                    HttpStatus.OK.value(), "Rút đơn ứng tuyển thành công", rs
            );
            return ResponseEntity.ok(response);
        } catch (AppException ex) {
            System.out.println("[WITH DRAW APPLICATION] AppException occurred");
            System.out.println("[WITH DRAW APPLICATION] ErrorCode: " + ex.getErrorCode());
            throw ex;
        }
    }



}
