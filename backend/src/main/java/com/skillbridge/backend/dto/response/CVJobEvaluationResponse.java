package com.skillbridge.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.skillbridge.backend.dto.RoadmapDTO;
import lombok.*;
import lombok.experimental.FieldDefaults;
import java.util.List;
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)


public class CVJobEvaluationResponse {
    String candidateId;
    String candidateName;
    String jobId;
    private String titleJob;
    Double matchScore;
    String strengths;
    String weaknesses;
    List<RoadmapDTO> roadmap;
}