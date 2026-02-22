package com.skillbridge.backend.dto.response;


public record OllamaResponse(
        String model,
        String response,
        boolean done
) {}