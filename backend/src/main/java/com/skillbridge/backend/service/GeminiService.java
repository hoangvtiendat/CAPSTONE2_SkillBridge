package com.skillbridge.backend.service;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.utils.DataParserUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.Map;

@Service
@Slf4j
public class GeminiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.model}")
    private String modelName;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public GeminiService(ObjectMapper objectMapper) {
        this.restTemplate = new RestTemplate();
        this.objectMapper = objectMapper;
        this.objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    /**
     * Gọi Gemini API và tự động parse kết quả về Object mong muốn
     */
    public <T> T callGemini(String prompt, Class<T> responseType) {
        String url = String.format("https://generativelanguage.googleapis.com/v1/models/%s:generateContent?key=%s",
                modelName, apiKey);

        log.info("--- CALLING GEMINI API [Model: {}] ---", modelName);
        Map<String, Object> requestBody = Map.of(
                "contents", Collections.singletonList(Map.of(
                        "parts", Collections.singletonList(Map.of("text", prompt))
                )),
                "generationConfig", Map.of(
                        "temperature", 0.1,
                        "maxOutputTokens", 8192
                )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            String responseBody = restTemplate.postForObject(url, entity, String.class);

            JsonNode root = objectMapper.readTree(responseBody);
            String aiRawResponse = root.path("candidates").get(0)
                    .path("content").path("parts").get(0)
                    .path("text").asText();

            log.debug("AI Raw Response: {}", aiRawResponse);
            String jsonStr = aiRawResponse.trim()
                    .replaceAll("^```json", "")
                    .replaceAll("```$", "")
                    .trim();
            jsonStr = DataParserUtils.cleanJson(jsonStr);
            try {
                return objectMapper.readValue(jsonStr, responseType);
            } catch (Exception e) {
                log.error("JSON vẫn không thể parse sau khi sửa: {}", jsonStr);
                throw new AppException(ErrorCode.INVALID_JSON_FORMAT);
            }
        } catch (Exception e) {
            log.error("Gemini API Error: {}", e.getMessage());
            throw new AppException(ErrorCode.INVALID_JSON_FORMAT);
        }
    }
}