package com.skillbridge.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.skillbridge.backend.enums.CompanyStatus;
import java.time.LocalDateTime;

public class CompanyResponse {
    @JsonProperty("id")
    private String id;
    
    @JsonProperty("name")
    private String name;
    
    @JsonProperty("taxId")
    private String taxId;
    
    @JsonProperty("gpkdUrl")
    private String gpkdUrl;
    
    @JsonProperty("imageUrl")
    private String imageUrl;
    
    @JsonProperty("status")
    private CompanyStatus status;
    
    @JsonProperty("description")
    private String description;
    
    @JsonProperty("address")
    private String address;
    
    @JsonProperty("websiteUrl")
    private String websiteUrl;
    
    @JsonProperty("createdAt")
    private LocalDateTime createdAt;

    public CompanyResponse() {}

    public CompanyResponse(String id, String name, String taxId, String gpkdUrl, String imageUrl, CompanyStatus status, String description, String address, String websiteUrl, LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.taxId = taxId;
        this.gpkdUrl = gpkdUrl;
        this.imageUrl = imageUrl;
        this.status = status;
        this.description = description;
        this.address = address;
        this.websiteUrl = websiteUrl;
        this.createdAt = createdAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getTaxId() { return taxId; }
    public void setTaxId(String taxId) { this.taxId = taxId; }

    public String getGpkdUrl() { return gpkdUrl; }
    public void setGpkdUrl(String gpkdUrl) { this.gpkdUrl = gpkdUrl; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public CompanyStatus getStatus() { return status; }
    public void setStatus(CompanyStatus status) { this.status = status; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getWebsiteUrl() { return websiteUrl; }
    public void setWebsiteUrl(String websiteUrl) { this.websiteUrl = websiteUrl; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String id;
        private String name;
        private String taxId;
        private String gpkdUrl;
        private String imageUrl;
        private CompanyStatus status;
        private String description;
        private String address;
        private String websiteUrl;
        private LocalDateTime createdAt;

        public Builder id(String id) { this.id = id; return this; }
        public Builder name(String name) { this.name = name; return this; }
        public Builder taxId(String taxId) { this.taxId = taxId; return this; }
        public Builder gpkdUrl(String gpkdUrl) { this.gpkdUrl = gpkdUrl; return this; }
        public Builder imageUrl(String imageUrl) { this.imageUrl = imageUrl; return this; }
        public Builder status(CompanyStatus status) { this.status = status; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder address(String address) { this.address = address; return this; }
        public Builder websiteUrl(String websiteUrl) { this.websiteUrl = websiteUrl; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public CompanyResponse build() {
            return new CompanyResponse(id, name, taxId, gpkdUrl, imageUrl, status, description, address, websiteUrl, createdAt);
        }
    }
}
