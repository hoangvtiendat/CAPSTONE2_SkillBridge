package com.skillbridge.backend.dto.response;

import com.skillbridge.backend.enums.SkillLevel;
import lombok.*;

@Data
@NoArgsConstructor
@Builder
public class CandidateSkillResponse {
    private String skillId;
    private String skillName;
    private Integer experienceYears;
    private SkillLevel level;

    public CandidateSkillResponse(String skillId, String skillName, Integer experienceYears, SkillLevel level) {
        this.skillId = skillId;
        this.skillName = skillName;
        this.experienceYears = experienceYears;
        this.level = level;
    }

    public String getSkillId() {
        return skillId;
    }

    public void setSkillId(String skillId) {
        this.skillId = skillId;
    }

    public String getSkillName() {
        return skillName;
    }

    public void setSkillName(String skillName) {
        this.skillName = skillName;
    }

    public Integer getExperienceYears() {
        return experienceYears;
    }

    public void setExperienceYears(Integer experienceYears) {
        this.experienceYears = experienceYears;
    }

    public SkillLevel getLevel() {
        return level;
    }

    public void setLevel(SkillLevel level) {
        this.level = level;
    }
}