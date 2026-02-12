package com.skillbridge.backend.dto.request;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class UpdateCandidateCvRequest {
    private String name;
    private String description;
    private String address;
    private Boolean isOpenToWork;
    private String categoryId;
    private List<ExperienceDetail> experience;
    private List<CandidateSkillRequest> skills;
    private List<DegreeRequest> degrees;

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

    public Boolean getIsOpenToWork() {
        return isOpenToWork;
    }

    public void setIsOpenToWork(Boolean isOpenToWork) {
        this.isOpenToWork = isOpenToWork;
    }

    public String getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(String categoryId) {
        this.categoryId = categoryId;
    }

    public List<ExperienceDetail> getExperience() {
        return experience;
    }

    public void setExperience(List<ExperienceDetail> experience) {
        this.experience = experience;
    }

    public List<CandidateSkillRequest> getSkills() {
        return skills;
    }

    public void setSkills(List<CandidateSkillRequest> skills) {
        this.skills = skills;
    }

    public List<DegreeRequest> getDegrees() {
        return degrees;
    }

    public void setDegrees(List<DegreeRequest> degrees) {
        this.degrees = degrees;
    }
}