package com.skillbridge.backend.dto.request;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
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
    List<ExperienceDetail> experience;
    List<CandidateSkillRequest> skills;
    List<DegreeRequest> degrees;

}