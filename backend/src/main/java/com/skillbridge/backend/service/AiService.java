package com.skillbridge.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillbridge.backend.dto.request.OllamaRequest;
import com.skillbridge.backend.dto.request.ollamaOptions;
import com.skillbridge.backend.dto.response.OllamaResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import java.util.Map;

@Service
public class AiService {

    private final RestClient ollamaRestClient;
    private final ObjectMapper objectMapper;

    @Value("${ai.ollama.model}")
    private String model;

    private static final String SYSTEM_PROMPT_CHECK_CV_AND_JD =
            """
            You are the AI core for 'SkillBridge - Career Path & Recruitment Optimization Platform'.
            Your EXCLUSIVE task is 'Skill Gap Analysis & Recommendation' using a Competency Matrix.

            STRICT RULES:
            - ONLY output valid JSON.
            - Use Vietnamese for all textual explanations.
            - Evaluate skills on a Level 1 to 5 scale.
            - If CV lacks a JD skill, cv_current_level is 0.
            - can_apply is true ONLY if gap_percentage is less than 20%.
            - If can_apply is false, you MUST provide a learning roadmap to reach the jd_required_level.

            JSON SCHEMA:
            {
              "match_score": number,
              "gap_percentage": number,
              "gap_analysis_summary": string,
              "competency_matrix": [
                {
                  "skill_name": string,
                  "jd_required_level": number,
                  "cv_current_level": number,
                  "status": "MET | GAP | MISSING"
                }
              ],
              "learning_roadmap": [
                {
                  "skill_to_upgrade": string,
                  "current_level": number,
                  "target_level": number,
                  "recommended_courses_or_actions": [string]
                }
              ],
              "can_apply": boolean
            }
            """;

    public AiService(RestClient ollamaRestClient, ObjectMapper objectMapper) {
        this.ollamaRestClient = ollamaRestClient;
        this.objectMapper = objectMapper;
    }

    public String analyzeSkillGap(Map<String, Object> cvData, Map<String, Object> jdData) {
        try {
            ollamaOptions options = ollamaOptions.builder()
                    .temperature(0.0)
                    .top_k(10)
                    .top_p(0.1)
                    .num_predict(1500)
                    .num_ctx(8192)
                    .build();

            String cvJsonString = objectMapper.writeValueAsString(cvData);
            String jdJsonString = objectMapper.writeValueAsString(jdData);

            String finalPrompt = SYSTEM_PROMPT_CHECK_CV_AND_JD +
                    "\n\n--- JD JSON ---\n" + jdJsonString +
                    "\n\n--- CV JSON ---\n" + cvJsonString;

            OllamaRequest requestPayload = OllamaRequest.builder()
                    .model(model)
                    .prompt(finalPrompt)
                    .stream(false)
                    .format("json")
                    .options(options)
                    .build();

            OllamaResponse response = ollamaRestClient.post()
                    .uri("/api/generate")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestPayload)
                    .retrieve()
                    .body(OllamaResponse.class);

            return response != null ? response.response() : "{}";

        } catch (Exception e) {
            e.printStackTrace();
            return "{}";
        }
    }
}