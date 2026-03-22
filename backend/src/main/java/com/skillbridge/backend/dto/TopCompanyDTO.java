package com.skillbridge.backend.dto;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopCompanyDTO {
    private String companyId;
    private String companyName;
    private Long totalJobs;
}