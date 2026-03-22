package com.skillbridge.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Builder;

@Builder
public record EvaluationRequest(
        @NotEmpty(message = "INVALID_INPUT")
        Object candidateSkills,

        @NotBlank(message = "INVALID_INPUT")
        String jobRequirements
) {}