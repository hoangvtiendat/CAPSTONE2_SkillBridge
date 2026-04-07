package com.skillbridge.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class RoadmapDTO {
    private String title;
    private String description;
    private String priority;
    private String duration;

    @JsonProperty("relatedWeakness") // Đảm bảo khớp chính xác với JSON từ Gemini
    private String relatedWeakness;
}
