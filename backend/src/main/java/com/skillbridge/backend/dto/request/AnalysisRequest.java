package com.skillbridge.backend.dto.request;

public record AnalysisRequest(
        Object candidateProfile,
        Object jobPosting
) {}