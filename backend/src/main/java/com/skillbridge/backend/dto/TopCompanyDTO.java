package com.skillbridge.backend.dto;

public class TopCompanyDTO {
    private String companyId;
    private String companyName;
    private Long totalJobs;

    public TopCompanyDTO(String companyId, String companyName, Long totalJobs) {
        this.companyId = companyId;
        this.companyName = companyName;
        this.totalJobs = totalJobs;
    }

    public String getCompanyId() {
        return companyId;
    }

    public String getCompanyName() {
        return companyName;
    }

    public Long getTotalJobs() {
        return totalJobs;
    }
}
