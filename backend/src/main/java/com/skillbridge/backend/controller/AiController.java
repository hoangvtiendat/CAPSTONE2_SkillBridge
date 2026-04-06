package com.skillbridge.backend.controller;

import com.skillbridge.backend.dto.request.MatchRequest;
import com.skillbridge.backend.dto.request.SemanticSearchRequest;
import com.skillbridge.backend.dto.response.JobResponse;
import com.skillbridge.backend.dto.response.JobSemanticSearchResponse;
import com.skillbridge.backend.entity.Job;
import com.skillbridge.backend.service.AI_Service_File.AIJobService;
import com.skillbridge.backend.service.AI_Service_File.AiService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/Ai-skillbridge")
@CrossOrigin(origins = "*")
public class AiController {

    private final AiService aiService;
    private final AIJobService aiJobService;

    public AiController(AiService aiService, AIJobService aiJobService) {
        this.aiService = aiService;
        this.aiJobService = aiJobService;
    }

    @PostMapping(value = "/analyze-gap", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> analyzeSkillGap(@RequestBody MatchRequest request) {

        if (request.cvData() == null || request.jdData() == null) {
            return ResponseEntity.badRequest()
                    .body("{\"error\": \"Dữ liệu cvData hoặc jdData không được để trống\"}");
        }

        String result = aiService.analyzeSkillGap(request.cvData(), request.jdData());

        return ResponseEntity.ok()
                .header("Content-Type", "application/json; charset=UTF-8")
                .body(result);
    }
    @PostMapping(value = "/ai-semantic-search", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> semanticSearch(@RequestBody SemanticSearchRequest request) {

        if (request.description() == null || request.description().isBlank()) {
            return ResponseEntity.badRequest().body("Yêu cầu không được để trống");
        }


        List<JobSemanticSearchResponse> jobs = aiJobService.findJobBySemanticSearch(request.description());

        return ResponseEntity.ok(jobs);
    }
}