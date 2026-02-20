package com.skillbridge.backend.dto.request;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
@Getter
@Setter
public class SkillRequest {
    private String name;
    private String category_id;
}
