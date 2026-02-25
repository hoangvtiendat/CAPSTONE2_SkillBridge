package com.skillbridge.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class JobSkillRequest {
    @NotBlank
    private String skillId;
    private Boolean isRequired;
}
