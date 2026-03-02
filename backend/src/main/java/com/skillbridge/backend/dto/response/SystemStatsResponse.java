package com.skillbridge.backend.dto.response;

import com.skillbridge.backend.dto.MonthlyJobDTO;
import com.skillbridge.backend.dto.MonthlyRevenueDTO;
import com.skillbridge.backend.dto.TopCompanyDTO;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
public class SystemStatsResponse {
    private OverviewStats overview;
    private GrowthStats growth;
    private PendingStats pending;
    private ChartSection charts;
    private List<com.skillbridge.backend.dto.TopCompanyDTO> topCompanies;

    @Data
    @Builder
    public static class OverviewStats {
        private long totalUsers;
        private long totalCompanies;
        private long totalJobs;
        private BigDecimal totalRevenue; // VND thường dùng long hoặc BigDecimal
    }

    @Data
    @Builder
    public static class GrowthStats {
        private double userGrowthPercent;
        private double companyGrowthPercent;
        private double jobGrowthPercent;
        private double revenueGrowthPercent;
    }

    @Data
    @Builder
    public static class PendingStats {
        private long pendingCompanies;
        private long pendingJobs;
    }

    @Data
    @Builder
    public static class ChartSection {
        private List<MonthlyRevenueDTO> revenueByMonth;
        private List<MonthlyJobDTO> jobGrowthByMonth;
    }

    @Data
    @AllArgsConstructor
    public static class MonthlyData {
        private String month; // Định dạng "YYYY-MM"
        private double value;
    }

    @Data
    @Builder
    public static class TopCompanyDTO {
        private String companyName;
        private int jobCount;
        private Integer applicationCount; // Có thể null cho một số công ty
        private String status; // ACTIVE, PENDING...
    }
}
