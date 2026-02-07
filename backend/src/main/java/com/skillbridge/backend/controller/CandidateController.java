package com.skillbridge.backend.controller;

import com.skillbridge.backend.config.CustomUserDetails;
import com.skillbridge.backend.dto.request.UpdateCandidateCvRequest;
import com.skillbridge.backend.dto.response.ApiResponse;
import com.skillbridge.backend.dto.response.UpdateCandidateCvResponse;
import com.skillbridge.backend.entity.Candidate;
import com.skillbridge.backend.service.CandidateService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/candidates")
public class CandidateController {

    private final CandidateService candidateService;

    public CandidateController(CandidateService candidateService) {
        this.candidateService = candidateService;
    }

//    @PostMapping("/upload")
//    public ResponseEntity<?> uploadCv(
//            @RequestParam("file") MultipartFile file
//    ) {
//        return ResponseEntity.ok(candidateService.processCv(file));
//    }
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
