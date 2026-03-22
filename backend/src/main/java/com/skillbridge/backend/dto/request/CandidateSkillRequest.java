package com.skillbridge.backend.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CandidateSkillRequest {
    @NotBlank(message = "SKILL_NOT_FOUND")
    String skillId;

    @NotNull(message = "INVALID_INPUT")
    @Min(value = 0, message = "INVALID_INPUT")
    Integer experienceYears;
}