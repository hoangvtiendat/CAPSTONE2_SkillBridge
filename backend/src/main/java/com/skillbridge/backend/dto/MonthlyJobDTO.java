package com.skillbridge.backend.dto;

public class MonthlyJobDTO {
    private Integer month;
    private Long totalJobs;

    public MonthlyJobDTO(Integer month, Long totalJobs) {
        this.month = month;
        this.totalJobs = totalJobs;
    }

    public Integer getMonth() {
        return month;
    }

    public Long getTotalJobs() {
        return totalJobs;
    }
}
