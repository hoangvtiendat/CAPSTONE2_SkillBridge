package com.skillbridge.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class JobSkillRequest {

    @NotBlank(message = "SKILL_NOT_FOUND")
    String skillId;

    @Builder.Default
    Boolean isRequired = true;
}