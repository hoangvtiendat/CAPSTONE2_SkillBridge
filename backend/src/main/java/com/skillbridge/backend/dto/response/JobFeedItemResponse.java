package com.skillbridge.backend.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public class JobFeedItemResponse {
    private String jobId;
    private Object title;
    private String description;
    private String companyName;
    private String companyImageUrl;
    private Object subscriptionPlanName;
    private String location;
    private String categoryName;
    private String salaryMin;
    private String salaryMax;
    List<String> skills;
    private LocalDateTime createdAt;

    public JobFeedItemResponse(String jobId, Object title, String description, String location,
                               String salaryMin, String salaryMax, LocalDateTime createdAt,
                               String companyName,String companyImageUrl, Object subscriptionPlanName, String categoryName) {
        this.jobId = jobId;
        this.title = title;
        this.description = description;
        this.location = location;
        this.salaryMin = salaryMin;
        this.salaryMax = salaryMax;
        this.createdAt = createdAt;
        this.companyName = companyName;
        this.companyImageUrl = companyImageUrl;
        this.subscriptionPlanName = subscriptionPlanName;
        this.categoryName = categoryName;
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

    public void setTitle(Object title) {
        this.title = title;
    }


    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
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

    public Object getSubscriptionPlanName() {
        return subscriptionPlanName;
    }

    public void setSubscriptionPlanName(Object subscriptionPlanName) {
        this.subscriptionPlanName = subscriptionPlanName;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
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
