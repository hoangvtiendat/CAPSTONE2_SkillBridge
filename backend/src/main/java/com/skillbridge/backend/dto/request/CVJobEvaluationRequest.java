package com.skillbridge.backend.dto.request;

import com.skillbridge.backend.dto.DegreeDTO;
import com.skillbridge.backend.dto.ExperienceDTO;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CVJobEvaluationRequest {
    String name;
    List<String> skills;
    String address;
    List<DegreeDTO> degrees;
    String category;
    List<ExperienceDTO> experience;
    String description;
}
