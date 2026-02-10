package com.skillbridge.backend.dto.response;

import lombok.*;

@Data
@NoArgsConstructor
@Builder
public class CandidateSkillResponse {
    private String skillId;
    private Integer experienceYears;

    public CandidateSkillResponse(String skillId, Integer experienceYears) {
        this.skillId = skillId;
        this.experienceYears = experienceYears;
    }

    public String getSkillId() {
        return skillId;
    }

    public void setSkillId(String skillId) {
        this.skillId = skillId;
    }

    public Integer getExperienceYears() {
        return experienceYears;
    }

    public void setExperienceYears(Integer experienceYears) {
        this.experienceYears = experienceYears;
    }
}