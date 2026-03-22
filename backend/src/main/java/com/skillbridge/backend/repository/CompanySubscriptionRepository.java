package com.skillbridge.backend.repository;

import com.skillbridge.backend.dto.MonthlyRevenueDTO;
import com.skillbridge.backend.dto.response.SystemStatsResponse;
import com.skillbridge.backend.entity.CompanySubscription;
import com.skillbridge.backend.entity.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CompanySubscriptionRepository extends JpaRepository<CompanySubscription, String> {

    /** Tính tổng doanh thu từ trước đến nay của toàn hệ thống */
    @Query("""
                SELECT COALESCE(SUM(sp.price), 0)
                FROM CompanySubscription cs
                JOIN cs.subscriptionPlan sp
            """)
    BigDecimal sumTotalRevenue();

    /** Thống kê doanh thu theo từng tháng kể từ một mốc thời gian cụ thể */
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

    /** Tính tổng doanh thu phát sinh trong một khoảng thời gian xác định */
    @Query("""
       SELECT COALESCE(SUM(sp.price), 0)
       FROM CompanySubscription cs
       JOIN cs.subscriptionPlan sp
       WHERE cs.startDate BETWEEN :start AND :end
       """)
    BigDecimal sumRevenueBetween(@Param("start") LocalDateTime start,
                                 @Param("end") LocalDateTime end);
    /** Tìm gói dịch vụ đang hoạt động (Active) của một công ty */
    @Query("""
            SELECT cs
            FROM CompanySubscription cs
            WHERE cs.company.id = :companyId
            AND cs.isActive = true
       """)
    List<CompanySubscription> findActiveSubscriptionByCompanyId(
            @Param("companyId") String companyId
    );
}
