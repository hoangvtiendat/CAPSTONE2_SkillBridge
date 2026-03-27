package com.skillbridge.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.skillbridge.backend.dto.request.DegreeRequest;
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
public class LLMResumeResponse {
    public String name;
    public String description;
    public String categoryId;
    public String categoryName;
    public String address;
    public List<DegreeRequest> degrees;
    public List<ExperienceDetail> experience;
    public List<CandidateSkillResponse> skills;
}
