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
        this.objectMapper.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    public <T> T callGemini(String prompt, Class<T> responseType) {
        String modelName = "gemini-2.5-flash";
        String url = "https://generativelanguage.googleapis.com/v1/models/" + modelName + ":generateContent?key=" + apiKey;

        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(Map.of(
                        "parts", List.of(Map.of("text", prompt))
                )),
                "generationConfig", Map.of(
                        "temperature", 0.1,      // Thấp để trả về kết quả chính xác, ít sáng tạo lỗi
                        "maxOutputTokens", 4096  // Tăng giới hạn để không bị cắt ngang JSON giữa chừng
                )
        );

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            String responseBody = restTemplate.postForObject(url, entity, String.class);
            JsonNode root = objectMapper.readTree(responseBody);

            String aiRawResponse = root.path("candidates").get(0)
                    .path("content").path("parts").get(0)
                    .path("text").asText();
            System.out.println("ai raw res: " + aiRawResponse);
            String jsonStr = cleanJson(aiRawResponse);

            // Cấu hình Jackson để không lỗi khi AI trả về các trường lạ
            objectMapper.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

            return objectMapper.readValue(jsonStr, responseType);
        } catch (Exception e) {
            e.printStackTrace();
            throw new AppException(ErrorCode.INVALID_JSON_FORMAT);
        }
    }

    private String cleanJson(String raw) {
        if (raw == null || raw.isEmpty()) return "{}";

        // Xóa các ký tự thừa như ```json ... ``` nếu AI trả về Markdown
        String cleaned = raw.replaceAll("(?s)```json(.*?)```", "$1").trim();

        int firstBrace = cleaned.indexOf("{");
        int lastBrace = cleaned.lastIndexOf("}");

        if (firstBrace >= 0 && lastBrace >= 0 && lastBrace > firstBrace) {
            return cleaned.substring(firstBrace, lastBrace + 1);
        }
        return cleaned;
    }
}
