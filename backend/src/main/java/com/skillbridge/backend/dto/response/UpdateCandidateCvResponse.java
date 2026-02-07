package com.skillbridge.backend.dto.response;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class UpdateCandidateCvResponse {
    private String candidateId;

    private Boolean isOpenToWork;
    private Integer yearsOfExperience;
    private Double expectedSalary;

    private String categoryId;
    private String categoryName;

    public UpdateCandidateCvResponse(String candidateId, Boolean isOpenToWork, Integer yearsOfExperience, Double expectedSalary, String categoryId, String categoryName, List<DegreeResponse> degrees) {
        this.candidateId = candidateId;
        this.isOpenToWork = isOpenToWork;
        this.yearsOfExperience = yearsOfExperience;
        this.expectedSalary = expectedSalary;
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.degrees = degrees;
    }

    // 🔥 Degrees / Certificates
    private List<DegreeResponse> degrees;

    public String getCandidateId() {
        return candidateId;
    }

    public void setCandidateId(String candidateId) {
        this.candidateId = candidateId;
    }

    public Boolean getIsOpenToWork() {
        return isOpenToWork;
    }

    public void setIsOpenToWork(Boolean openToWork) {
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

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public List<DegreeResponse> getDegrees() {
        return degrees;
    }

    public void setDegrees(List<DegreeResponse> degrees) {
        this.degrees = degrees;
    }
}