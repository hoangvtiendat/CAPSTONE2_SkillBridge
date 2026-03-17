package com.skillbridge.backend.entity;
import com.skillbridge.backend.enums.SubscriptionOfCompanyStatus;
import com.skillbridge.backend.enums.SubscriptionPlanStatus;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "subcription_of_company")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubcriptionOfCompany {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

    @Enumerated(EnumType.STRING)
    private SubscriptionPlanStatus name;
    @Column(name = "job_limit")
    private Integer jobLimit;

    @Column(name = "candidate_view_limit")
    private Integer candidateViewLimit;

    @Column(name = "current_job_count")
    private Integer currentJobCount = 0;

    @Column(name = "current_view_count")
    private Integer currentViewCount = 0;

    @Column(name = "has_priority_display")
    private Boolean hasPriorityDisplay;

    private BigDecimal price;

    @Enumerated(EnumType.STRING)
    private SubscriptionOfCompanyStatus status;

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "posting_Duration")
    private Integer postingDuration;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.currentJobCount == null) this.currentJobCount = 0;
        if (this.currentViewCount == null) this.currentViewCount = 0;
    }

    // Manual Getter/Setters to fix Lombok build issues in CLI
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public Company getCompany() { return company; }
    public void setCompany(Company company) { this.company = company; }
    
    public SubscriptionPlanStatus getName() { return name; }
    public void setName(SubscriptionPlanStatus name) { this.name = name; }
    
    public Integer getJobLimit() { return jobLimit; }
    public void setJobLimit(Integer jobLimit) { this.jobLimit = jobLimit; }
    
    public Integer getCandidateViewLimit() { return candidateViewLimit; }
    public void setCandidateViewLimit(Integer candidateViewLimit) { this.candidateViewLimit = candidateViewLimit; }
    
    public Integer getCurrentJobCount() { return currentJobCount; }
    public void setCurrentJobCount(Integer currentJobCount) { this.currentJobCount = currentJobCount; }
    
    public Integer getCurrentViewCount() { return currentViewCount; }
    public void setCurrentViewCount(Integer currentViewCount) { this.currentViewCount = currentViewCount; }
    
    public Boolean getHasPriorityDisplay() { return hasPriorityDisplay; }
    public void setHasPriorityDisplay(Boolean hasPriorityDisplay) { this.hasPriorityDisplay = hasPriorityDisplay; }
    
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    
    public SubscriptionOfCompanyStatus getStatus() { return status; }
    public void setStatus(SubscriptionOfCompanyStatus status) { this.status = status; }
    
    public LocalDateTime getStartDate() { return startDate; }
    public void setStartDate(LocalDateTime startDate) { this.startDate = startDate; }
    
    public LocalDateTime getEndDate() { return endDate; }
    public void setEndDate(LocalDateTime endDate) { this.endDate = endDate; }
    
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public Integer getPostingDuration() { return postingDuration; }
    public void setPostingDuration(Integer postingDuration) { this.postingDuration = postingDuration; }
}