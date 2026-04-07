package com.skillbridge.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParsedContentDTO {
    private List<String> skills;
    private String address;
    private List<DegreeDTO> degrees;
    private String category;
    private List<ExperienceDTO> experience;
    private String description;
}
