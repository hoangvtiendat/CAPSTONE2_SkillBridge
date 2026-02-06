package com.skillbridge.backend.entity;

import com.skillbridge.backend.enums.SubscriptionPlanStatus;
import jakarta.persistence.*;

import java.math.BigDecimal;
/// Done
@Entity
@Table(name = "subscription_plans")
public class SubscriptionPlan extends BaseEntity{

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Enumerated(EnumType.STRING)
    private SubscriptionPlanStatus name;

    private BigDecimal price;

    private Integer jobLimit;

    private Integer candidateViewLimit;

    private Boolean hasPriorityDisplay;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public SubscriptionPlanStatus getName() {
        return name;
    }

    public void setName(SubscriptionPlanStatus name) {
        this.name = name;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Integer getJobLimit() {
        return jobLimit;
    }

    public void setJobLimit(Integer jobLimit) {
        this.jobLimit = jobLimit;
    }

    public Integer getCandidateViewLimit() {
        return candidateViewLimit;
    }

    public void setCandidateViewLimit(Integer candidateViewLimit) {
        this.candidateViewLimit = candidateViewLimit;
    }

    public Boolean getHasPriorityDisplay() {
        return hasPriorityDisplay;
    }

    public void setHasPriorityDisplay(Boolean hasPriorityDisplay) {
        this.hasPriorityDisplay = hasPriorityDisplay;
    }
}
