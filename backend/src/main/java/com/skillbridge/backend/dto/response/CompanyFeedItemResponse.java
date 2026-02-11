package com.skillbridge.backend.dto.response;

import com.skillbridge.backend.enums.CompanyStatus;
import com.skillbridge.backend.enums.SubscriptionPlanStatus;

public class CompanyFeedItemResponse {
    private String id;
    private String name;
    private String taxId;
    private String gpkdUrl;
    private String imageUrl;
    private String description;
    private String address;
    private String websiteUrl;
    private CompanyStatus status;
    private SubscriptionPlanStatus subscriptionPlanName;

    public CompanyFeedItemResponse(String id, String name, String taxId, String gpkdUrl,
                                   String imageUrl, String description, String address,
                                   String websiteUrl, CompanyStatus status, SubscriptionPlanStatus subscriptionPlanName) {
        this.id = id;
        this.name = name;
        this.taxId = taxId;
        this.gpkdUrl = gpkdUrl;
        this.imageUrl = imageUrl;
        this.description = description;
        this.address = address;
        this.websiteUrl = websiteUrl;
        this.status = status;
        this.subscriptionPlanName = subscriptionPlanName;
    }

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

    public String getTaxId() {
        return taxId;
    }

    public void setTaxId(String taxId) {
        this.taxId = taxId;
    }

    public String getGpkdUrl() {
        return gpkdUrl;
    }

    public void setGpkdUrl(String gpkdUrl) {
        this.gpkdUrl = gpkdUrl;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getWebsiteUrl() {
        return websiteUrl;
    }

    public void setWebsiteUrl(String websiteUrl) {
        this.websiteUrl = websiteUrl;
    }

    public CompanyStatus getStatus() {
        return status;
    }

    public void setStatus(CompanyStatus status) {
        this.status = status;
    }

    public SubscriptionPlanStatus getSubscriptionPlanName() {
        return subscriptionPlanName;
    }

    public void setSubscriptionPlanName(SubscriptionPlanStatus subscriptionPlanName) {
        this.subscriptionPlanName = subscriptionPlanName;
    }
}
