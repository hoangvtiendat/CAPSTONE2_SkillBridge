package com.skillbridge.backend.dto;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyJobDTO {
    private Integer month;
    private Long totalJobs;
}