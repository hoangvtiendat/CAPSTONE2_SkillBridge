package com.skillbridge.backend.entity;

import com.skillbridge.backend.enums.SubscriptionOfCompanyStatus;
import com.skillbridge.backend.enums.SubscriptionPlanStatus;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "company_subscriptions")
public class SubscriptionOfCompany extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36)
    @Setter(AccessLevel.NONE)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubscriptionPlanStatus name;

    @Column(name = "job_limit")
    private Integer jobLimit;

    @Column(name = "candidate_view_limit")
    private Integer candidateViewLimit;

    @Builder.Default
    @Column(name = "current_job_count", nullable = false)
    private Integer currentJobCount = 0;

    @Builder.Default
    @Column(name = "current_view_count", nullable = false)
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
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "posting_duration")
    private Integer postingDuration;
}