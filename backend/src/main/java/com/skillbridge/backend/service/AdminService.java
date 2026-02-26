package com.skillbridge.backend.service;

import com.skillbridge.backend.dto.MonthlyJobDTO;
import com.skillbridge.backend.dto.MonthlyRevenueDTO;
import com.skillbridge.backend.dto.TopCompanyDTO;
import com.skillbridge.backend.dto.response.SystemStatsResponse;
import com.skillbridge.backend.entity.CompanySubscription;
import com.skillbridge.backend.enums.CompanyStatus;
import com.skillbridge.backend.enums.JobStatus;
import com.skillbridge.backend.repository.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AdminService {
    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final JobRepository jobRepository;
    private final CompanySubscriptionRepository subscriptionRepository;

    public SystemStatsResponse statsOverview() {

        // ===== 1. OVERVIEW =====
        long totalUsers = userRepository.count();
        long totalCompanies = companyRepository.count();
        long totalJobs = jobRepository.count();

        BigDecimal totalRevenue = Optional.ofNullable(subscriptionRepository.sumTotalRevenue()).orElse(BigDecimal.ZERO);

        SystemStatsResponse.OverviewStats overview = SystemStatsResponse.OverviewStats.builder().totalUsers(totalUsers).totalCompanies(totalCompanies).totalJobs(totalJobs).totalRevenue(totalRevenue).build();


        // ===== 2. PENDING =====
        long pendingCompanies = companyRepository.countByStatus((CompanyStatus.PENDING));

        long pendingJobs = jobRepository.countByStatus((JobStatus.PENDING));

        SystemStatsResponse.PendingStats pending = SystemStatsResponse.PendingStats.builder().pendingCompanies(pendingCompanies).pendingJobs(pendingJobs).build();


        // ===== 3. GROWTH (Ví dụ so với tháng trước) =====
        LocalDate now = LocalDate.now();
        LocalDate firstDayThisMonth = now.withDayOfMonth(1);
        LocalDate firstDayLastMonth = firstDayThisMonth.minusMonths(1);

        LocalDateTime firstDayThisMonthDateTime = firstDayThisMonth.atStartOfDay();
        LocalDateTime firstDayLastMonthDateTime = firstDayLastMonth.atStartOfDay();

        long usersThisMonth = userRepository.countByCreatedAtAfter(firstDayThisMonthDateTime);

        long usersLastMonth = userRepository.countByCreatedAtBetween(firstDayLastMonthDateTime, firstDayThisMonthDateTime);

        double userGrowth = calculateGrowth(usersLastMonth, usersThisMonth);

        SystemStatsResponse.GrowthStats growth = SystemStatsResponse.GrowthStats.builder().userGrowthPercent(userGrowth).companyGrowthPercent(0).jobGrowthPercent(0).revenueGrowthPercent(0).build();


        // ===== 4. CHART DATA (Revenue theo tháng) =====
        LocalDateTime sixMonthsAgo = LocalDate.now().minusMonths(5).withDayOfMonth(1).atStartOfDay();

        List<MonthlyRevenueDTO> revenueByMonth = subscriptionRepository.revenueLast6Months(sixMonthsAgo);
        List<MonthlyJobDTO> jobGrowthByMonth = jobRepository.jobGrowthLast6Months(sixMonthsAgo);

        SystemStatsResponse.ChartSection charts = SystemStatsResponse.ChartSection.builder().revenueByMonth(revenueByMonth).jobGrowthByMonth(jobGrowthByMonth).build();


        // ===== 5. TOP COMPANY =====
        List<TopCompanyDTO> topCompanies = companyRepository.findTop5ByJobCount(PageRequest.of(0, 5));


        return new SystemStatsResponse(overview, growth, pending, charts, topCompanies);
    }


    private double calculateGrowth(long oldValue, long newValue) {
        if (oldValue == 0) return newValue > 0 ? 100 : 0;
        return ((double) (newValue - oldValue) / oldValue) * 100;
    }

}
