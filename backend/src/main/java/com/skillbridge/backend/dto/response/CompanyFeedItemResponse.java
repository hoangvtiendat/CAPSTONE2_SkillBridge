package com.skillbridge.backend.dto.response;

import com.skillbridge.backend.enums.CompanyStatus;
import com.skillbridge.backend.enums.SubscriptionPlanStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

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
    String email;
    String phoneNumber;
    CompanyStatus status;
    SubscriptionPlanStatus subscriptionPlanName;
    LocalDateTime createdAt;

    @Builder.Default
    long jobCount = 0;
}