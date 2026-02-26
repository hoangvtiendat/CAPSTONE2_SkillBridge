package com.skillbridge.backend.repository;

import com.skillbridge.backend.dto.MonthlyRevenueDTO;
import com.skillbridge.backend.dto.response.SystemStatsResponse;
import com.skillbridge.backend.entity.CompanySubscription;
import com.skillbridge.backend.entity.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface CompanySubscriptionRepository extends JpaRepository<CompanySubscription, String> {
    @Query("""
                SELECT COALESCE(SUM(sp.price), 0)
                FROM CompanySubscription cs
                JOIN cs.subscriptionPlan sp
            """)
    BigDecimal sumTotalRevenue();

    @Query("""
                SELECT new com.skillbridge.backend.dto.MonthlyRevenueDTO(
                    MONTH(cs.startDate),
                    SUM(sp.price)
                )
                FROM CompanySubscription cs
                JOIN cs.subscriptionPlan sp
                WHERE cs.startDate >= :fromDate
                GROUP BY MONTH(cs.startDate)
                ORDER BY MONTH(cs.startDate)
            """)
    List<MonthlyRevenueDTO> revenueLast6Months(@Param("fromDate") LocalDateTime fromDate);

    @Query("""
       SELECT SUM(sp.price)
       FROM CompanySubscription cs
       JOIN cs.subscriptionPlan sp
       WHERE cs.startDate BETWEEN :start AND :end
       """)
    BigDecimal sumRevenueBetween(LocalDateTime start,
                                 LocalDateTime end);
}
