package com.skillbridge.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.skillbridge.backend.enums.JobStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {
    private String id;
    private String title;
    private String content;
    @JsonProperty("read")
    private boolean read;
    private String type;
    private String link;
    private LocalDateTime createdAt;
    private String objId;
    private JobStatus jobStatus;
    private String action;
    private String company;
}
