package com.skillbridge.backend.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidateSkillResponse {

    private String skillId;
    private String skillName;
    private Integer experienceYears;

}