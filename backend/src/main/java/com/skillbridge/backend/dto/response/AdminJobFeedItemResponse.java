package com.skillbridge.backend.dto.response;

import com.skillbridge.backend.enums.JobStatus;
import com.skillbridge.backend.enums.ModerationStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AdminJobFeedItemResponse extends JobFeedItemResponse {

    String status;
    String moderationStatus;

    public AdminJobFeedItemResponse(
            String jobId, Object title, String position, String description, String location,
            BigDecimal salaryMin, BigDecimal salaryMax, LocalDateTime createdAt,
            String companyName, String companyImageUrl,
            Object subscriptionPlanName, String categoryName,
            JobStatus status, ModerationStatus moderationStatus) {

        super(jobId, title, position, description, location, salaryMin, salaryMax, createdAt,
                companyName, companyImageUrl, subscriptionPlanName, categoryName);

        this.status = status != null ? status.name() : null;
        this.moderationStatus = moderationStatus != null ? moderationStatus.name() : null;
    }
}