package com.skillbridge.backend.dto.request;

public class CompanyIdentificationRequest {
    private String name;
    private String taxcode;
    private String description;
    private String address;
    private String websiteUrl;

    public CompanyIdentificationRequest(String name, String taxcode, String businessLicenseUrl, String imageUrl, String description, String address, String websiteUrl) {
        this.name = name;
        this.taxcode = taxcode;
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
