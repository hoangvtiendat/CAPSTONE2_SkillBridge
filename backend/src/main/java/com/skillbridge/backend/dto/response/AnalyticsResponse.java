package com.skillbridge.backend.dto.response;

import lombok.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsResponse {
    @Builder.Default
    private SummaryStats summary = new SummaryStats();
    @Builder.Default
    private List<ConversionStep> conversionFunnel = new ArrayList<>();
    @Builder.Default
    private List<TrendData> trends = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SummaryStats {
        @Builder.Default
        private long totalViews = 0;
        @Builder.Default
        private long totalApplications = 0;
        @Builder.Default
        private long qualifiedCandidates = 0;
        @Builder.Default
        private long totalInterviews = 0;
        @Builder.Default
        private long successfulHires = 0;
        @Builder.Default
        private double timeToHire = 0;
        @Builder.Default
        private double timeToFill = 0;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConversionStep {
        private String stage; // View, Apply, Interview, Hire
        private long count;
        private double percentage; // conversion from previous stage
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrendData {
        private String date;
        private long views;
        private long applications;
        private long hires;
    }
}
