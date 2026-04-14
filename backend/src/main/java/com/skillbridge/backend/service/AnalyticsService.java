package com.skillbridge.backend.service;

import com.skillbridge.backend.dto.response.AnalyticsResponse;
import com.skillbridge.backend.entity.*;
import com.skillbridge.backend.enums.ApplicationStatus;
import com.skillbridge.backend.enums.InterviewStatus;
import com.skillbridge.backend.enums.JobStatus;
import com.skillbridge.backend.repository.*;
import com.skillbridge.backend.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService {

    private final JobRepository jobRepository;
    private final ApplicationRepository applicationRepository;
    private final InterviewRepository interviewRepository;
    private final SecurityUtils securityUtils;
    private final CompanyMemberRepository companyMemberRepository;
    private final ZoneId systemZone = ZoneId.systemDefault();

    @Transactional(readOnly = true)
    public AnalyticsResponse getRecruiterAnalytics(String jobId, LocalDateTime startDate, LocalDateTime endDate) {
        String companyId = getCurrentCompanyId();
        if (companyId == null) {
            return AnalyticsResponse.builder().build(); 
        }
        
        List<Job> jobs = fetchJobs(companyId, jobId, startDate, endDate);
        List<Application> applications = (jobId != null) 
                ? applicationRepository.findByJob_Id(jobId)
                : applicationRepository.findByJob_Company_Id(companyId);

        applications = applications.stream()
                .filter(a -> (startDate == null || a.getCreatedAt().isAfter(startDate)))
                .filter(a -> (endDate == null || a.getCreatedAt().isBefore(endDate)))
                .collect(Collectors.toList());

        log.info("Analytics for company {}: jobs found={}, applications filtered={}", companyId, jobs.size(), applications.size());

        // Summary Stats
        long totalViews = jobs.stream().mapToLong(j -> j.getViewCount() != null ? j.getViewCount() : 0).sum();
        long totalApps = applications.size();
        long qualifiedApps = applications.stream()
                .filter(a -> (a.getAiMatchingScore() != null && a.getAiMatchingScore() >= 70) || (a.getStatus() != null && a.getStatus() != ApplicationStatus.REJECTED))
                .count();
        
        long totalInterviews = applications.stream()
                .filter(a -> a.getStatus() == ApplicationStatus.INTERVIEW || a.getStatus() == ApplicationStatus.HIRED)
                .count();
        
        long successfulHires = applications.stream()
                .filter(a -> a.getStatus() == ApplicationStatus.HIRED)
                .count();

        double avgTimeToHire = calculateAvgTimeToHire(applications);
        double avgTimeToFill = calculateAvgTimeToFill(jobs);
// ... (omitting some unchanged code for brevity in thought, but I will provide full replacement content)

        AnalyticsResponse.SummaryStats summary = AnalyticsResponse.SummaryStats.builder()
                .totalViews(totalViews)
                .totalApplications(totalApps)
                .qualifiedCandidates(qualifiedApps)
                .totalInterviews(totalInterviews)
                .successfulHires(successfulHires)
                .timeToHire(avgTimeToHire)
                .timeToFill(avgTimeToFill)
                .build();

        // Conversion Funnel
        List<AnalyticsResponse.ConversionStep> funnel = new ArrayList<>();
        funnel.add(new AnalyticsResponse.ConversionStep("Views", totalViews, 100.0));
        funnel.add(new AnalyticsResponse.ConversionStep("Apply", totalApps, totalViews > 0 ? (double) totalApps * 100 / totalViews : 0));
        funnel.add(new AnalyticsResponse.ConversionStep("Interview", totalInterviews, totalApps > 0 ? (double) totalInterviews * 100 / totalApps : 0));
        funnel.add(new AnalyticsResponse.ConversionStep("Hire", successfulHires, totalInterviews > 0 ? (double) successfulHires * 100 / totalInterviews : 0));

        // Trends (Last 7 days or based on date range)
        List<AnalyticsResponse.TrendData> trends = calculateTrends(applications, jobs, startDate, endDate);

        return AnalyticsResponse.builder()
                .summary(summary)
                .conversionFunnel(funnel)
                .trends(trends)
                .build();
    }

    private String getCurrentCompanyId() {
        String userId = securityUtils.getCurrentUserId();
        return companyMemberRepository.findByUser_Id(userId)
                .map(cm -> cm.getCompany().getId())
                .orElse(null);
    }

    private List<Job> fetchJobs(String companyId, String jobId, LocalDateTime start, LocalDateTime end) {
        if (jobId != null) {
            return jobRepository.findById(jobId)
                    .filter(j -> j.getCompany().getId().equals(companyId))
                    .map(Collections::singletonList)
                    .orElse(Collections.emptyList());
        }
        return jobRepository.findJobsByCompanyId(companyId).stream()
                .filter(j -> (start == null || j.getCreatedAt().isAfter(start)))
                .filter(j -> end == null || j.getCreatedAt().isBefore(end))
                .collect(Collectors.toList());
    }

    private double calculateAvgTimeToHire(List<Application> applications) {
        List<Application> hiredApps = applications.stream()
                .filter(a -> a.getStatus() == ApplicationStatus.HIRED)
                .collect(Collectors.toList());
        
        if (hiredApps.isEmpty()) return 0;
        
        long totalDays = hiredApps.stream()
                .filter(a -> a.getUpdatedAt() != null && a.getCreatedAt() != null)
                .mapToLong(a -> Duration.between(a.getCreatedAt(), a.getUpdatedAt()).toDays())
                .sum();
        
        return (double) totalDays / hiredApps.size();
    }

    private double calculateAvgTimeToFill(List<Job> jobs) {
        List<Job> closedJobs = jobs.stream()
                .filter(j -> j.getStatus() == JobStatus.CLOSED || j.getStatus() == JobStatus.LOCK)
                .collect(Collectors.toList());
        
        if (closedJobs.isEmpty()) return 0;
        
        long totalDays = closedJobs.stream()
                .filter(j -> j.getUpdatedAt() != null && j.getCreatedAt() != null)
                .mapToLong(j -> Duration.between(j.getCreatedAt(), j.getUpdatedAt()).toDays())
                .sum();
        
        return (double) totalDays / closedJobs.size();
    }

    private List<AnalyticsResponse.TrendData> calculateTrends(List<Application> applications, List<Job> jobs, LocalDateTime start, LocalDateTime end) {
        // Group by date
        Map<String, Long> appsByDate = applications.stream()
                .filter(a -> a.getCreatedAt() != null)
                .collect(Collectors.groupingBy(a -> a.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE), Collectors.counting()));
        
        Map<String, Long> hiresByDate = applications.stream()
                .filter(a -> a.getStatus() == ApplicationStatus.HIRED && a.getUpdatedAt() != null)
                .collect(Collectors.groupingBy(a -> a.getUpdatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE), Collectors.counting()));

        // For simplicity, we use the last 7 days if no range provided
        LocalDateTime trendStart = (start != null) ? start : LocalDateTime.now().minusDays(7);
        LocalDateTime trendEnd = (end != null) ? end : LocalDateTime.now();
        
        List<AnalyticsResponse.TrendData> trends = new ArrayList<>();
        LocalDateTime current = trendStart;
        while (current.isBefore(trendEnd) || current.isEqual(trendEnd)) {
            String dateStr = current.format(DateTimeFormatter.ISO_LOCAL_DATE);
            trends.add(AnalyticsResponse.TrendData.builder()
                    .date(dateStr)
                    .applications(appsByDate.getOrDefault(dateStr, 0L))
                    .hires(hiresByDate.getOrDefault(dateStr, 0L))
                    .views(0) // Views are aggregate in Job entity, no time-series data unless we log views
                    .build());
            current = current.plusDays(1);
        }
        return trends;
    }

    public byte[] exportAnalyticsToCsv(String jobId, LocalDateTime startDate, LocalDateTime endDate) {
        AnalyticsResponse data = getRecruiterAnalytics(jobId, startDate, endDate);
        StringBuilder csv = new StringBuilder();
        csv.append("Metric,Value\n");
        csv.append("Total Views,").append(data.getSummary().getTotalViews()).append("\n");
        csv.append("Total Applications,").append(data.getSummary().getTotalApplications()).append("\n");
        csv.append("Qualified Candidates,").append(data.getSummary().getQualifiedCandidates()).append("\n");
        csv.append("Total Interviews,").append(data.getSummary().getTotalInterviews()).append("\n");
        csv.append("Successful Hires,").append(data.getSummary().getSuccessfulHires()).append("\n");
        csv.append("Avg Time-to-Hire (days),").append(String.format("%.2f", data.getSummary().getTimeToHire())).append("\n");
        csv.append("Avg Time-to-Fill (days),").append(String.format("%.2f", data.getSummary().getTimeToFill())).append("\n");
        
        csv.append("\nConversion Funnel\n");
        csv.append("Stage,Count,Percentage\n");
        for (AnalyticsResponse.ConversionStep step : data.getConversionFunnel()) {
            csv.append(step.getStage()).append(",").append(step.getCount()).append(",").append(String.format("%.2f%%", step.getPercentage())).append("\n");
        }
        
        return csv.toString().getBytes();
    }
}
