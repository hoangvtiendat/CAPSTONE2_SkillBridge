package com.skillbridge.backend.dto.request;


public record OllamaOptions(
        double temperature,
        int seed
) {}