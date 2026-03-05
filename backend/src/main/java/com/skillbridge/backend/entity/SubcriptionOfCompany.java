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
}