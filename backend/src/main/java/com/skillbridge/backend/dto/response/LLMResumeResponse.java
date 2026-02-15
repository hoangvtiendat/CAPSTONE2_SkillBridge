package com.skillbridge.backend.dto.response;

import com.skillbridge.backend.dto.request.DegreeRequest;
import com.skillbridge.backend.dto.request.ExperienceDetail;

import java.util.List;

public class LLMResumeResponse {
    public String name;
    public String description;
    public String address;
    public List<DegreeRequest> degrees;
    public List<ExperienceDetail> experience;
    public List<CandidateSkillResponse> skills;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public List<DegreeRequest> getDegrees() {
        return degrees;
    }

    public void setDegrees(List<DegreeRequest> degrees) {
        this.degrees = degrees;
    }

    public List<ExperienceDetail> getExperience() {
        return experience;
    }

    public void setExperience(List<ExperienceDetail> experience) {
        this.experience = experience;
    }

    public List<CandidateSkillResponse> getSkills() {
        return skills;
    }

    public void setSkills(List<CandidateSkillResponse> skills) {
        this.skills = skills;
    }
}
