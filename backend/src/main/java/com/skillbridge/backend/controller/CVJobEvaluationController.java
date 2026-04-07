package com.skillbridge.backend.controller;

import com.skillbridge.backend.config.CustomUserDetails;
import com.skillbridge.backend.dto.request.CVJobEvaluationRequest;
import com.skillbridge.backend.dto.response.ApiResponse;
import com.skillbridge.backend.dto.response.CVJobEvaluationResponse;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.service.CVJobEvaluationService;
import com.skillbridge.backend.utils.SecurityUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/evaluation")
public class CVJobEvaluationController {
    private final SecurityUtils securityUtils;
    private final CVJobEvaluationService cvJobEvaluationService;

    @PostMapping("/{jobId}")
    public ResponseEntity<ApiResponse<CVJobEvaluationResponse>> createCVJobEvaluation(@PathVariable String jobId, @RequestBody CVJobEvaluationRequest request) {
        try {
            CVJobEvaluationResponse rs = cvJobEvaluationService.createCVJobEvaluation(jobId, request);
            ApiResponse<CVJobEvaluationResponse> response = new ApiResponse<>(
                    HttpStatus.OK.value(),
                    "Chấm điểm độ phù hợp",
                    rs
            );
            return ResponseEntity.ok(response);
        } catch (AppException ex) {
            System.out.println("[CV JOB EVALUATION] AppException occurred");
            System.out.println("[CV JOB EVALUATION] ErrorCode: " + ex.getErrorCode());
            throw ex;
        }
    }

    @GetMapping("/{jobId}")
    public ResponseEntity<ApiResponse<CVJobEvaluationResponse>> getCVJobEvaluation(@PathVariable String jobId) {
        try {
            CVJobEvaluationResponse rs = cvJobEvaluationService.getCVJobEvaluation(jobId);
            ApiResponse<CVJobEvaluationResponse> response = new ApiResponse<>(
                    HttpStatus.OK.value(),
                    "Chấm điểm độ phù hợp",
                    rs
            );
            return ResponseEntity.ok(response);
        } catch (AppException ex) {
            System.out.println("[CV JOB EVALUATION] AppException occurred");
            System.out.println("[CV JOB EVALUATION] ErrorCode: " + ex.getErrorCode());
            throw ex;
        }
    }
}
