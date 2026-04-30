package com.skillbridge.backend.repository;

import com.skillbridge.backend.dto.MonthlyRevenueDTO;
import com.skillbridge.backend.entity.SubscriptionOfCompany;
import com.skillbridge.backend.enums.SubscriptionOfCompanyStatus;
import com.skillbridge.backend.enums.SubscriptionPlanStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SubscriptionOfCompanyRepository extends JpaRepository<SubscriptionOfCompany, String> {
    /** Tính tổng doanh thu từ trước đến nay của toàn hệ thống */
    @Query("""
                SELECT COALESCE(SUM(cs.price), 0)
                FROM SubscriptionOfCompany cs
            """)
    BigDecimal sumTotalRevenue();

    /** Thống kê doanh thu theo từng tháng kể từ một mốc thời gian cụ thể */
    @Query("""
        SELECT new com.skillbridge.backend.dto.MonthlyRevenueDTO(
            MONTH(cs.startDate),
            SUM(cs.price)
        )
        FROM SubscriptionOfCompany cs
        WHERE cs.startDate >= :fromDate
        GROUP BY MONTH(cs.startDate)
        ORDER BY MONTH(cs.startDate)
    """)
    List<MonthlyRevenueDTO> revenueLast6Months(@Param("fromDate") LocalDateTime fromDate);

    /** Tính tổng doanh thu phát sinh trong một khoảng thời gian xác định */
    @Query("""
       SELECT COALESCE(SUM(cs.price), 0)
       FROM SubscriptionOfCompany cs
       WHERE cs.startDate BETWEEN :start AND :end
       """)
    BigDecimal sumRevenueBetween(@Param("start") LocalDateTime start,
                                 @Param("end") LocalDateTime end);

    /** Tìm gói dịch vụ đang hoạt động (Active) của một công ty */
    @Query("""
            SELECT cs
            FROM SubscriptionOfCompany cs
            WHERE cs.company.id = :companyId
            AND cs.isActive = true
       """)
    List<SubscriptionOfCompany> findActiveSubscriptionByCompanyId(
            @Param("companyId") String companyId
    );

    /** Lấy toàn bộ lịch sử đăng ký của một công ty */
    List<SubscriptionOfCompany> findByCompanyId (String companyId);

    /** Lấy toàn bộ lịch sử đăng ký của công ty(chưa xoá) */
    List<SubscriptionOfCompany> findByCompanyIdAndDeletedFalse(String companyId);

    /** Tìm gói đăng ký dựa trên ID công ty và trạng thái */
    Optional<SubscriptionOfCompany> findByCompanyIdAndStatus(String id, SubscriptionOfCompanyStatus status);

    /** Tìm tất cả gói đăng ký đã vượt quá ngày kết thúc (EndDate) */
    List<SubscriptionOfCompany> findAllByEndDateBefore(LocalDateTime now);

    /** Tìm các gói cước hết hạn nhưng ngoại trừ một loại tên gói cụ thể */
    List<SubscriptionOfCompany> findAllByEndDateBeforeAndStatus(
            LocalDateTime date,
            SubscriptionOfCompanyStatus status
    );

    /** Tìm các gói cước hết hạn theo chính xác trạng thái và tên gói */
    List<SubscriptionOfCompany> findAllByEndDateBeforeAndStatusAndName(
            LocalDateTime date,
            SubscriptionOfCompanyStatus status,
            SubscriptionPlanStatus name
    );

    /** Tìm kiếm gói đăng ký cụ thể dựa trên ID công ty và tên loại gói */
    Optional<SubscriptionOfCompany> findByCompanyIdAndName(String companyId, SubscriptionPlanStatus name);
}