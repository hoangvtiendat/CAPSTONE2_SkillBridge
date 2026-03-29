package com.skillbridge.backend.controller;

import com.skillbridge.backend.dto.request.MatchRequest;
import com.skillbridge.backend.service.AI_Service_File.AiService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/Ai-skillbridge")
@CrossOrigin(origins = "*")
public class AiController {

    private final AiService aiService;

    public AiController(AiService aiService) {
        this.aiService = aiService;
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
}