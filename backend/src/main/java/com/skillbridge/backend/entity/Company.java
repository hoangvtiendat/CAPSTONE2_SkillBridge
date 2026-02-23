package com.skillbridge.backend.entity;

import com.skillbridge.backend.enums.CompanyStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.validator.constraints.URL;

import java.util.List;

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
public class Company extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @NotBlank(message = "Tên công ty không được để trống")
    @Size(max = 255, message = "Tên công ty không được vượt quá 255 ký tự")
    @Column(nullable = false)
    private String name;

    @NotBlank(message = "Mã số thuế không được để trống")
    @Column(name = "tax_id", nullable = false, unique = true)
    private String taxId;

    @URL(message = "Định dạng link giấy phép kinh doanh không hợp lệ")
    @Column(name = "business_license_url")
    private String businessLicenseUrl; // link ảnh GPKD

    @URL(message = "Định dạng link ảnh không hợp lệ")
    @Column(name = "image_url")
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CompanyStatus status;

    @Size(max = 2000, message = "Mô tả không được vượt quá 2000 ký tự")
    @Column(columnDefinition = "TEXT")
    private String description;

    @NotBlank(message = "Địa chỉ không được để trống")
    private String address;

    @URL(message = "Định dạng website không hợp lệ")
    @Column(name = "website_url")
    private String websiteUrl;

    @OneToMany(mappedBy = "company", fetch = FetchType.LAZY)
    private List<CompanySubscription> subscriptions;

    public String getCurrentSubscriptionPlanName() {
        if (this.subscriptions == null || this.subscriptions.isEmpty()) {
            return "No Plan";
        }

        return this.subscriptions.stream()
                .filter(sub -> Boolean.TRUE.equals(sub.getActive()))
                .findFirst()
                .map(sub -> sub.getSubscriptionPlan().getName().toString())
                .orElse("No Active Plan");
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
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
