package com.skillbridge.backend.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public class JobDetailResponse {
    private String jobId;
    private Object title;
    private String description;
    private String position;
    private String location;
    private String salaryMin;
    private String salaryMax;
    private String status;
    private String moderationStatus;
    private String companyId;
    private String companyName;
    private String companyImageUrl;
    private String categoryName;
    private List<String> skills;
    private LocalDateTime createdAt;

    public JobDetailResponse(String jobId, Object title, String description, String position, String location, String salaryMin, String salaryMax, String status, String moderationStatus, String companyId, String companyName, String companyImageUrl, String categoryName, List<String> skills, LocalDateTime createdAt) {
        this.jobId = jobId;
        this.title = title;
        this.description = description;
        this.position = position;
        this.location = location;
        this.salaryMin = salaryMin;
        this.salaryMax = salaryMax;
        this.status = status;
        this.moderationStatus = moderationStatus;
        this.companyId = companyId;
        this.companyName = companyName;
        this.companyImageUrl = companyImageUrl;
        this.categoryName = categoryName;
        this.skills = skills;
        this.createdAt = createdAt;
    }

    public String getJobId() {
        return jobId;
    }

    public void setJobId(String jobId) {
        this.jobId = jobId;
    }

    public Object getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getPosition() {
        return position;
    }

    public void setPosition(String position) {
        this.position = position;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getSalaryMin() {
        return salaryMin;
    }

    public void setSalaryMin(String salaryMin) {
        this.salaryMin = salaryMin;
    }

    public String getSalaryMax() {
        return salaryMax;
    }

    public void setSalaryMax(String salaryMax) {
        this.salaryMax = salaryMax;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getModerationStatus() {
        return moderationStatus;
    }

    public void setModerationStatus(String moderationStatus) {
        this.moderationStatus = moderationStatus;
    }

    public String getCompanyId() {
        return companyId;
    }

    public void setCompanyId(String companyId) {
        this.companyId = companyId;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getCompanyImageUrl() {
        return companyImageUrl;
    }

    public void setCompanyImageUrl(String companyImageUrl) {
        this.companyImageUrl = companyImageUrl;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public List<String> getSkills() {
        return skills;
    }

    public void setSkills(List<String> skills) {
        this.skills = skills;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
