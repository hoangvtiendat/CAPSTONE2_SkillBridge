package com.skillbridge.backend.dto.request;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UpdateCandidateCvRequest {
    String name;
    String description;
    String address;
    Boolean isOpenToWork;
    String categoryId;
    String cvUrl;
    List<ExperienceDetail> experience;
    List<CandidateSkillRequest> skills;
    List<DegreeRequest> degrees;
}