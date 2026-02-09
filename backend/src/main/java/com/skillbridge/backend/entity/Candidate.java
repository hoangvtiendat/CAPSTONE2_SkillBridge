package com.skillbridge.backend.entity;

import jakarta.persistence.*;
/// Done
@Entity
@Table(name = "candidates")
public class Candidate extends BaseEntity{

    @Id
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn (name = "user_id")
    private User user; // dùng chung id với user

    private String cvUrl;

    @Column(columnDefinition = "json")
    private String parsedContentJson;

    @Column(columnDefinition = "json")
    private String vectorEmbedding;

    private Boolean isOpenToWork;

    private Integer yearsOfExperience;

    private Double expectedSalary;

    @Column(columnDefinition = "json")
    private Object degree;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getCvUrl() {
        return cvUrl;
    }

    public void setCvUrl(String cvUrl) {
        this.cvUrl = cvUrl;
    }

    public String getParsedContentJson() {
        return parsedContentJson;
    }

    public void setParsedContentJson(String parsedContentJson) {
        this.parsedContentJson = parsedContentJson;
    }

    public String getVectorEmbedding() {
        return vectorEmbedding;
    }

    public void setVectorEmbedding(String vectorEmbedding) {
        this.vectorEmbedding = vectorEmbedding;
    }

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

    public Object getDegree() {
        return degree;
    }

    public void setDegree(Object degree) {
        this.degree = degree;
    }

    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
    }
}
