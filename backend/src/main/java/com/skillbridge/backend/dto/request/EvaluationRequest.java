package com.skillbridge.backend.dto.request;

// Dùng Object cho candidateSkills để nó nhận được mọi định dạng JSON từ React
public record EvaluationRequest(
        Object candidateSkills,
        String jobRequirements
) {}