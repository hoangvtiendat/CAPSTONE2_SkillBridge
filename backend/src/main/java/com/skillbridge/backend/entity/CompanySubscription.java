package com.skillbridge.backend.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;
/// Done
@Entity
@Table(name = "company_subscriptions")
public class CompanySubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id")
    private SubscriptionPlan subscriptionPlan;

    private Integer currentJobCount;
    private Integer currentViewCount;

    private LocalDateTime startDate;
    private LocalDateTime endDate;

    private Boolean isActive;

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

    public SubscriptionPlan getSubscriptionPlan() {
        return subscriptionPlan;
    }

    public void setSubscriptionPlan(SubscriptionPlan subscriptionPlan) {
        this.subscriptionPlan = subscriptionPlan;
    }

    public Integer getCurrentJobCount() {
        return currentJobCount;
    }

    public void setCurrentJobCount(Integer currentJobCount) {
        this.currentJobCount = currentJobCount;
    }

    public Integer getCurrentViewCount() {
        return currentViewCount;
    }

    public void setCurrentViewCount(Integer currentViewCount) {
        this.currentViewCount = currentViewCount;
    }

    public LocalDateTime getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDateTime startDate) {
        this.startDate = startDate;
    }

    public LocalDateTime getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDateTime endDate) {
        this.endDate = endDate;
    }

    public Boolean getActive() {
        return isActive;
    }

    public void setActive(Boolean active) {
        isActive = active;
    }
}

