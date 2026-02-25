package com.skillbridge.backend.dto.response;

import java.time.LocalDateTime;
import com.skillbridge.backend.enums.JobStatus;
import com.skillbridge.backend.enums.ModerationStatus;

public class AdminJobFeedItemResponse extends JobFeedItemResponse {
    private String status;
    private String moderationStatus;

    public AdminJobFeedItemResponse(String jobId, Object title, String location,
                                    String salaryMin, String salaryMax, LocalDateTime createdAt,
                                    String companyName, String companyImageUrl,
                                    Object subscriptionPlanName, String categoryName,
                                    JobStatus status, ModerationStatus moderationStatus) {

        super(jobId, title, location, salaryMin, salaryMax, createdAt,
                companyName, companyImageUrl, subscriptionPlanName, categoryName);
        this.status = status != null ? status.name() : null;
        this.moderationStatus = moderationStatus != null ? moderationStatus.name() : null;
    }

    public AdminJobFeedItemResponse() {
        super(null, null, null, null, null, null, null, null, null, null);
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getModerationStatus() {
        return moderationStatus;
    }

    public void setModerationStatus(String moderationStatus) {
        this.moderationStatus = moderationStatus;
    }
}