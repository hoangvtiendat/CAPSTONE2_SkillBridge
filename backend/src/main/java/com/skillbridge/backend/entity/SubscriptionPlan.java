package com.skillbridge.backend.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "subscription_plans")
public class SubscriptionPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String name;

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

    public String getName() {
        return name;
    }

    public void setName(String name) {
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
