package com.skillbridge.backend.entity; // Tốt nhất là bạn nên move file này sang package 'dto' thay vì 'entity'

import com.skillbridge.backend.enums.JobStatus;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationForAI {
  private String userId;

    private String objId;
    private String title;
    private JobStatus status;
    private String message;
    private String action;

}