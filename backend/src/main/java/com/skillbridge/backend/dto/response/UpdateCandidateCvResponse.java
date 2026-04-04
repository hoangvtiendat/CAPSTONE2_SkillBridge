package com.skillbridge.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.skillbridge.backend.dto.request.ExperienceDetail;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UpdateCandidateCvResponse {
    private String name;
    private String description;
    private Boolean isOpenToWork;
    private String address;
    private String category;

    private List<DegreeResponse> degrees;
    private List<CandidateSkillResponse> skills;
    private List<ExperienceDetail> experience;
}