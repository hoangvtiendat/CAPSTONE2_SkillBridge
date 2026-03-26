package com.skillbridge.backend.dto.request;

import java.util.Map;

public record MatchRequest(
        Map<String, Object> cvData,
        Map<String, Object> jdData
) {}