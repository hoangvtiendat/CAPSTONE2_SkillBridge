package com.skillbridge.backend.dto.response;

import com.skillbridge.backend.enums.CompanyStatus;

public class CompanyFeedItemResponse {
    private String id;
    private String name;
    private String taxId;
    private String businessLicenseUrl;
    private String imageUrl;
    private String description;
    private String address;
    private String websiteUrl;
    private CompanyStatus status;
    private String subscriptionPlanName;

    public CompanyFeedItemResponse(String id, String name, String taxId, String businessLicenseUrl,
                                   String imageUrl, String description, String address,
                                   String websiteUrl, CompanyStatus status, String subscriptionPlanName) {
        this.id = id;
        this.name = name;
        this.taxId = taxId;
        this.businessLicenseUrl = businessLicenseUrl;
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

    public String getBusinessLicenseUrl() {
        return businessLicenseUrl;
    }

    public void setBusinessLicenseUrl(String businessLicenseUrl) {
        this.businessLicenseUrl = businessLicenseUrl;
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

    public String getSubscriptionPlanName() {
        return subscriptionPlanName;
    }

    public void setSubscriptionPlanName(String subscriptionPlanName) {
        this.subscriptionPlanName = subscriptionPlanName;
    }
}
