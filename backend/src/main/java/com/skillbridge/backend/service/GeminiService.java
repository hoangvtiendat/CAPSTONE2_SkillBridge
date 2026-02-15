package com.skillbridge.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class GeminiService {
    @Value("${gemini.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper;

    public GeminiService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public <T> T callGemini(String prompt, Class<T> responseType) {
        String modelName = "gemini-2.5-flash";
        String url = "https://generativelanguage.googleapis.com/v1/models/" + modelName + ":generateContent?key=" + apiKey;

        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        Map<String, Object> requestBody = Map.of(
                "contents", List.of(Map.of(
                        "parts", List.of(Map.of("text", prompt))
                ))
        );

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            System.out.println("Connecting to Gemini API: " + url);
            org.springframework.http.ResponseEntity<String> responseEntity =
                    restTemplate.postForEntity(url, entity, String.class);

            String responseBody = restTemplate.postForObject(url, requestBody, String.class);
            JsonNode root = objectMapper.readTree(responseBody);

            String aiRawResponse = root.path("candidates").get(0)
                    .path("content").path("parts").get(0)
                    .path("text").asText();

            String jsonStr = cleanJson(aiRawResponse);
            return objectMapper.readValue(jsonStr, responseType);
        } catch (Exception e) {
            throw new AppException(ErrorCode.INVALID_JSON_FORMAT);
        }
    }

    private String cleanJson(String raw) {
        if (raw == null || raw.isEmpty()) return "{}";
        Pattern pattern = Pattern.compile("\\{.*\\}", Pattern.DOTALL);
        Matcher matcher = pattern.matcher(raw);

        if (matcher.find()) {
            return matcher.group();
        }
        return raw.trim();
    }
}