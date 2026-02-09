package com.skillbridge.backend.dto.request;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class UpdateCandidateCvRequest {

    private Boolean isOpenToWork;
    private Integer yearsOfExperience;
    private Double expectedSalary;
    private String categoryId;
    private List<CandidateSkillRequest> skills;
    // 🔥 Degrees / Certificates
    private List<DegreeRequest> degrees;

    public Boolean getOpenToWork() {
        return isOpenToWork;
    }

    public void setOpenToWork(Boolean openToWork) {
        isOpenToWork = openToWork;
    }

    public Integer getYearsOfExperience() {
        return yearsOfExperience;
    }

    public void setYearsOfExperience(Integer yearsOfExperience) {
        this.yearsOfExperience = yearsOfExperience;
    }

    public Double getExpectedSalary() {
        return expectedSalary;
    }

    public void setExpectedSalary(Double expectedSalary) {
        this.expectedSalary = expectedSalary;
    }

    public String getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(String categoryId) {
        this.categoryId = categoryId;
    }

    public List<DegreeRequest> getDegrees() {
        return degrees;
    }

    public void setDegrees(List<DegreeRequest> degrees) {
        this.degrees = degrees;
    }

    public List<CandidateSkillRequest> getSkills() {
        return skills;
    }

    public void setSkills(List<CandidateSkillRequest> skills) {
        this.skills = skills;
    }
}
