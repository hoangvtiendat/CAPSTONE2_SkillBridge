package com.skillbridge.backend.dto.request;

public class CompanyIdentificationRequest {
    private String name;
    private String taxcode;
    private String businessLicenseUrl;
    private String imageUrl;
    private String description;
    private String address;
    private String websiteUrl;

    public CompanyIdentificationRequest(String name, String taxcode, String businessLicenseUrl, String imageUrl, String description, String address, String websiteUrl) {
        this.name = name;
        this.taxcode = taxcode;
        this.businessLicenseUrl = businessLicenseUrl;
        this.imageUrl = imageUrl;
        this.description = description;
        this.address = address;
        this.websiteUrl = websiteUrl;
    }

    public CompanyIdentificationRequest() {
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getTaxcode() {
        return taxcode;
    }

    public void setTaxcode(String taxcode) {
        this.taxcode = taxcode;
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
}
