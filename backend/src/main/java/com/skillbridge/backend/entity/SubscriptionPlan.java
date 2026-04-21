package com.skillbridge.backend.entity;

import com.skillbridge.backend.enums.SubscriptionPlanStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "subscription_plans")
public class SubscriptionPlan extends BaseEntity {
    @Id

    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36)
    @Setter(AccessLevel.NONE)
    private String id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true)
    private SubscriptionPlanStatus name;

    @Column(precision = 19, scale = 2)
    private BigDecimal price;

    @Column(name = "job_limit")
    private Integer jobLimit;

    @Column(name = "posting_duration")
    private Integer postingDuration;

    @Column(name = "candidate_view_limit")
    private Integer candidateViewLimit;

    @Column(name = "has_priority_display")
    @Builder.Default
    private Boolean hasPriorityDisplay = false;

    @Column(name = "is_public")
    private Boolean isPublic;
}