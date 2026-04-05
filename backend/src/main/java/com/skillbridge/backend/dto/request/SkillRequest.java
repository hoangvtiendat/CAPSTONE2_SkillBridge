package com.skillbridge.backend.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SkillRequest {

    @NotBlank(message = "SKILL_NAME_REQUIRED")
    String name;

    @JsonProperty("category_id")
    String categoryId;



    public void setName(String name) {
        this.name = (name != null) ? name.trim() : null;
    }
}