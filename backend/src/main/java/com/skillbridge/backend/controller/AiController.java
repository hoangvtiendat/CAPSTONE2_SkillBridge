package com.skillbridge.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillbridge.backend.dto.request.EvaluationRequest;
import com.skillbridge.backend.service.AiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/ai")
@CrossOrigin(origins = "http://localhost:3000")
public class AiController {

    private final AiService aiService;
    private final ObjectMapper objectMapper; // Dùng để ép kiểu JSON

    public AiController(AiService aiService) {
        this.aiService = aiService;
        this.objectMapper = new ObjectMapper();
    }

    @PostMapping("/evaluate")
    public ResponseEntity<Map<String, String>> evaluateCandidate(@RequestBody EvaluationRequest request) {
        try {
            // Chuyển cục JSON candidateSkills thành chuỗi String để AI đọc
            String candidateSkillsStr = objectMapper.writeValueAsString(request.candidateSkills());

            // Gọi Service
            String evaluationResult = aiService.analyzeAndScoreSkills(
                    candidateSkillsStr,
                    request.jobRequirements()
            );

            return ResponseEntity.ok(Map.of("result", evaluationResult));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", "Lỗi xử lý dữ liệu đầu vào"));
        }
    }
}