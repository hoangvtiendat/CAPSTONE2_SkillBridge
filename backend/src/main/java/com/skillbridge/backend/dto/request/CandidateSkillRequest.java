package com.skillbridge.backend.dto.request;

import com.skillbridge.backend.enums.SkillLevel;

public class CandidateSkillRequest {
    private String skillId;
    private Integer experienceYears;
    private SkillLevel level;

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

    public SkillLevel getLevel() {
        return level;
    }

    public void setLevel(SkillLevel level) {
        this.level = level;
    }
}