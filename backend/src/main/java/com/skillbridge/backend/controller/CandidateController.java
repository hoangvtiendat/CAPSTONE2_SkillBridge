package com.skillbridge.backend.controller;

import com.skillbridge.backend.config.CustomUserDetails;
import com.skillbridge.backend.dto.request.UpdateCandidateCvRequest;
import com.skillbridge.backend.dto.response.ApiResponse;
import com.skillbridge.backend.dto.response.UpdateCandidateCvResponse;
import com.skillbridge.backend.entity.Candidate;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.service.CandidateService;
import com.skillbridge.backend.service.OcrService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/candidates")
public class CandidateController {

    private final CandidateService candidateService;
    private final OcrService ocrService;
    public CandidateController(CandidateService candidateService, OcrService ocrService) {
        this.candidateService = candidateService;
        this.ocrService = ocrService;
    }

    @PostMapping("/parse-cv")
    public ResponseEntity<ApiResponse<UpdateCandidateCvRequest>> parseCv(@RequestParam("file") MultipartFile file) {
        try {
            //Dùng Tesseract lấy text
            String rawText = ocrService.scanFile(file);
            System.out.println("LOG RAW TEXT: [" + rawText + "]");

            if (rawText == null || rawText.trim().isEmpty()) {
                System.out.println(">>> Tesseract KHÔNG đọc được chữ nào!");
            }
            //Dùng Regex/Logic bóc tách sang DTO
            UpdateCandidateCvRequest parsedRequest = candidateService.parseRawText(rawText);

            ApiResponse<UpdateCandidateCvRequest> response = new ApiResponse<>();
            response.setResult(parsedRequest);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            throw new AppException(ErrorCode.INVALID_FILE_FORMAT);
        }
    }
    @GetMapping("/cv")
    public ResponseEntity<ApiResponse<UpdateCandidateCvResponse>> getCv(
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        UpdateCandidateCvResponse result = candidateService.getCv(user.getUserId());

        ApiResponse<UpdateCandidateCvResponse> response = new ApiResponse<>();
        response.setResult(result);

        return ResponseEntity.ok(response);
    }
    @PutMapping("/cv")
    public ResponseEntity<ApiResponse<UpdateCandidateCvResponse>> updateCv(
        @AuthenticationPrincipal CustomUserDetails user,
        @RequestBody UpdateCandidateCvRequest request
    ) {
        UpdateCandidateCvResponse result = candidateService.updateCv(user.getUserId(), request);

        ApiResponse<UpdateCandidateCvResponse> response = new ApiResponse<>();
        response.setResult(result);

        return ResponseEntity.ok(response);
    }
}
