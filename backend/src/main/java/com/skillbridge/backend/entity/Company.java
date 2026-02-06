package com.skillbridge.backend.entity;

import com.skillbridge.backend.enums.CompanyStatus;
import jakarta.persistence.*;
import lombok.*;
/// Done
@Entity
@Table(
        name = "companies",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = "tax_id")
        }
)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(name = "tax_id", nullable = false, unique = true)
    private String taxId;

    @Column(name = "gpkd_url")
    private String gpkdUrl; // link ảnh GPKD

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CompanyStatus status;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String address;

    @Column(name = "website_url")
    private String websiteUrl;

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

    public CompanyStatus getStatus() {
        return status;
    }

    public void setStatus(CompanyStatus status) {
        this.status = status;
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
