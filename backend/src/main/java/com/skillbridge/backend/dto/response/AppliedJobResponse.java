package com.skillbridge.backend.dto.response;

import com.skillbridge.backend.enums.ApplicationStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppliedJobResponse {
    String applicationId;
    String jobId;
    String jobPosition;
    String companyName;
    String companyLogo;
    String location;
    BigDecimal salaryMin;
    BigDecimal salaryMax;
    ApplicationStatus status;
    LocalDateTime appliedAt;
}
