package com.skillbridge.backend.service;

import com.skillbridge.backend.dto.request.OllamaRequest;
import com.skillbridge.backend.dto.response.OllamaResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.http.client.SimpleClientHttpRequestFactory;

@Service
public class AiService {

    private final RestClient restClient;

    @Value("${ai.ollama.model}")
    private String aiModel;

    public AiService(@Value("${ai.ollama.url}") String ollamaUrl) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000);
        factory.setReadTimeout(180000);

        this.restClient = RestClient.builder()
                .baseUrl(ollamaUrl)
                .requestFactory(factory)
                .defaultHeader("Content-Type", "application/json")
                .defaultHeader("ngrok-skip-browser-warning", "true")
                .build();
    }

    public String callAi(String fullPrompt) {
        try {
            OllamaRequest requestPayload = OllamaRequest.builder()
                    .model(aiModel)
                    .prompt(fullPrompt)
                    .stream(false)
                    .format("json")
                    .build();

            OllamaResponse response = restClient.post()
                    .uri("/api/generate")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestPayload)
                    .retrieve()
                    .body(OllamaResponse.class);

            return response != null ? response.response() : "{}";
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}