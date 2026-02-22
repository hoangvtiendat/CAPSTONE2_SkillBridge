package com.skillbridge.backend.dto.request;

import lombok.Builder;

@Builder
public record OllamaRequest(
        String model,
        String prompt,
        boolean stream,
        String format,
        OllamaOptions options

) {}