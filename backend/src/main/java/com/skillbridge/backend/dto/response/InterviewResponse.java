package com.skillbridge.backend.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class InterviewResponse {
    String id;
    String jobId;
    String candidateId;
    String jobPosition;
    LocalDateTime startTime;
    String locationLink;
    String description;
    String status;
}