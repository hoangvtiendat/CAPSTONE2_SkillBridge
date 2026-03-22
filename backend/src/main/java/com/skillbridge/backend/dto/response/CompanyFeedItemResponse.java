package com.skillbridge.backend.dto.response;

import com.skillbridge.backend.enums.CompanyStatus;
import com.skillbridge.backend.enums.SubscriptionPlanStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CompanyFeedItemResponse {

    String id;
    String name;
    String taxId;
    String businessLicenseUrl;
    String imageUrl;
    String description;
    String address;
    String websiteUrl;
    CompanyStatus status;
    SubscriptionPlanStatus subscriptionPlanName;

    @Builder.Default
    long jobCount = 0;

    /**
     * Constructor này cực kỳ quan trọng nếu bạn dùng JPQL SELECT new ...
     */
    public CompanyFeedItemResponse(String id, String name, String taxId, String businessLicenseUrl,
                                   String imageUrl, String description, String address,
                                   String websiteUrl, CompanyStatus status, SubscriptionPlanStatus subscriptionPlanName) {
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
        this.jobCount = 0;
    }
}