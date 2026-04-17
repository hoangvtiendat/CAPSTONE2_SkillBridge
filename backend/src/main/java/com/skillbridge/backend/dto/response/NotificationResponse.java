package com.skillbridge.backend.dto.response;

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
    private boolean isRead;
    private String type;
    private String link;
    private LocalDateTime createdAt;
}
