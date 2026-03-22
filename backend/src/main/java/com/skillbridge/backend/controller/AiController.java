package com.skillbridge.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillbridge.backend.dto.request.EvaluationRequest;
import com.skillbridge.backend.service.AiService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@CrossOrigin(origins = "http://localhost:3000")
public class AiController {

    AiService aiService;
    ObjectMapper objectMapper;

    /**
     * Phân tích và chấm điểm kỹ năng ứng viên so với yêu cầu công việc bằng AI
     */
    @PostMapping("/evaluate")
    public ResponseEntity<Map<String, String>> evaluateCandidate(
            @RequestBody EvaluationRequest request
    ) {
        try {
            String candidateSkillsStr = objectMapper.writeValueAsString(request.candidateSkills());
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