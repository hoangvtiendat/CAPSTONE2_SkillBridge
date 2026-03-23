package com.skillbridge.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillbridge.backend.dto.request.AnalysisRequest;
import com.skillbridge.backend.dto.request.EvaluationRequest;
import com.skillbridge.backend.dto.response.CvAnalysisResponse;
import com.skillbridge.backend.service.AiService;
import com.skillbridge.backend.service.CvAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/Ai-skillbridge")
@RequiredArgsConstructor
public class AiController {
    private final CvAnalysisService cvAnalysisService;
    @PostMapping("/analyze")
    public ResponseEntity<CvAnalysisResponse> analyze(@RequestBody AnalysisRequest request) {
        CvAnalysisResponse result = cvAnalysisService.analyzeCvAgainstJob(
                request.candidateProfile(),
                request.jobPosting()
        );
        return ResponseEntity.ok(result);
    }
}