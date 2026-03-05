package com.skillbridge.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
@Getter
@Setter
public class SkillRequest {
    @NotBlank
    private String name;
    private String category_id;
    public void setName(String name){
        this.name = (name != null) ? name.replaceAll("\\s+", "") : null;
    }
}
