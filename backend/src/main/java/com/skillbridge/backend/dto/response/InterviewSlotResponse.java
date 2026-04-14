package com.skillbridge.backend.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class InterviewSlotResponse {
    String id;
    String jobId;
    LocalDateTime startTime;
    LocalDateTime endTime;
    int capacity;
    int currentOccupancy;
    String locationLink;
    String description;
    String status;
}