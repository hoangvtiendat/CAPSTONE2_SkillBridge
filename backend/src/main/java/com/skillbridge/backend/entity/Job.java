package com.skillbridge.backend.entity;

import com.skillbridge.backend.enums.JobStatus;
import com.skillbridge.backend.enums.ModerationStatus;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.List;
import java.util.Map;

/// Done
@Entity
@Table(name = "jobs")
public class Job extends BaseEntity{

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recruiter_id")
    private CompanyMember companyMember;

    private String position;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json")
    private Map<String, Object> title;

    @Enumerated(EnumType.STRING)
    private ModerationStatus moderationStatus;

    private Float moderationScore;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json")
    private float[] vectorEmbedding;

    private Integer viewCount;

    @Enumerated(EnumType.STRING)
    private JobStatus status;

    @OneToMany(mappedBy = "job", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<JobSkill> jobSkills;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String salaryMin;
    private String salaryMax;

    private String location;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Company getCompany() {
        return company;
    }

    public void setCompany(Company company) {
        this.company = company;
    }

    public CompanyMember getCompanyMember() {
        return companyMember;
    }

    public void setCompanyMember(CompanyMember companyMember) {
        this.companyMember = companyMember;
    }

    public String getPosition() {
        return position;
    }

    public void setPosition(String position) {
        this.position = position;
    }

    public Map<String, Object> getTitle() {
        return title;
    }

    public void setTitle(Map<String, Object> title) {
        this.title = title;
    }

    public ModerationStatus getModerationStatus() {
        return moderationStatus;
    }

    public void setModerationStatus(ModerationStatus moderationStatus) {
        this.moderationStatus = moderationStatus;
    }

    public Float getModerationScore() {
        return moderationScore;
    }

    public void setModerationScore(Float moderationScore) {
        this.moderationScore = moderationScore;
    }

    public float[] getVectorEmbedding() {
        return vectorEmbedding;
    }

    public void setVectorEmbedding(float[] vectorEmbedding) {
        this.vectorEmbedding = vectorEmbedding;
    }

    public Integer getViewCount() {
        return viewCount;
    }

    public void setViewCount(Integer viewCount) {
        this.viewCount = viewCount;
    }

    public JobStatus getStatus() {
        return status;
    }

    public void setStatus(JobStatus status) {
        this.status = status;
    }

    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
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

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }
    public List<JobSkill> getJobSkills() {
        return jobSkills;
    }
    public void setJobSkills(List<JobSkill> jobSkills) {
        this.jobSkills = jobSkills;
    }
}