package com.skillbridge.backend.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class JobFeedItemResponse {
    String jobId;
    Object title;
    String description;
    String companyName;
    String companyImageUrl;
    Object subscriptionPlanName;
    String location;
    String categoryName;
    BigDecimal salaryMin;
    BigDecimal salaryMax;
    List<String> skills;
    LocalDateTime createdAt;

    /**
     * Constructor tùy chỉnh nếu bạn vẫn dùng Query thủ công từ Repository (JPQL)
     */
    public JobFeedItemResponse(String jobId, Object title, String description, String location,
                               BigDecimal salaryMin, BigDecimal salaryMax, LocalDateTime createdAt,
                               String companyName, String companyImageUrl, Object subscriptionPlanName, String categoryName) {
        this.jobId = jobId;
        this.title = title;
        this.description = description;
        this.location = location;
        this.salaryMin = salaryMin;
        this.salaryMax = salaryMax;
        this.createdAt = createdAt;
        this.companyName = companyName;
        this.companyImageUrl = companyImageUrl;
        this.subscriptionPlanName = subscriptionPlanName;
        this.categoryName = categoryName;
    }
}