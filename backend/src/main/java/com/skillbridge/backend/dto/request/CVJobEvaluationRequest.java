package com.skillbridge.backend.dto.request;

import com.skillbridge.backend.dto.DegreeDTO;
import com.skillbridge.backend.dto.ExperienceDTO;
import lombok.Data;

import java.util.List;

@Data
public class CVJobEvaluationRequest {
    private String name;
    private List<String> skills;
    private String address;
    private List<DegreeDTO> degrees;
    private String category;
    private List<ExperienceDTO> experience;
    private String description;
}
