package com.skillbridge.backend.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobInvitationResponse {
    private String id;
    private LocalDateTime expiresAt;

    private JobInfo job;

    @Data
    @Builder
    public static class JobInfo {
        private String id;
        private String title;
        private String companyName;
        private String location;
    }
}