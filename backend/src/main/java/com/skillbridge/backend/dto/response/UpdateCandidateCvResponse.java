package com.skillbridge.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.skillbridge.backend.dto.request.ExperienceDetail;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class UpdateCandidateCvResponse {
    private String name;
    private String description;
    private String address;
    private String category;

    private List<DegreeResponse> degrees;
    private List<CandidateSkillResponse> skills;
    private List<ExperienceDetail> experience;

    public UpdateCandidateCvResponse() {}

    public UpdateCandidateCvResponse(String name, String description, String address, String category,
                                     List<DegreeResponse> degrees, List<CandidateSkillResponse> skills,
                                     List<ExperienceDetail> experience) {
        this.name = name;
        this.description = description;
        this.address = address;
        this.category = category;
        this.degrees = degrees;
        this.skills = skills;
        this.experience = experience;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public List<DegreeResponse> getDegrees() { return degrees; }
    public void setDegrees(List<DegreeResponse> degrees) { this.degrees = degrees; }

    public List<CandidateSkillResponse> getSkills() { return skills; }
    public void setSkills(List<CandidateSkillResponse> skills) { this.skills = skills; }

    public List<ExperienceDetail> getExperience() { return experience; }
    public void setExperience(List<ExperienceDetail> experience) { this.experience = experience; }
}