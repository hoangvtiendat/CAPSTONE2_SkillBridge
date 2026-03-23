package com.skillbridge.backend.repository;

import com.skillbridge.backend.entity.SubscriptionOfCompany;
import com.skillbridge.backend.enums.SubscriptionOfCompanyStatus;
import com.skillbridge.backend.enums.SubscriptionPlanStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SubscriptionOfCompanyRepository extends JpaRepository<SubscriptionOfCompany, String> {
    /** Lấy toàn bộ lịch sử đăng ký của một công ty */
    List<SubscriptionOfCompany> findByCompanyId (String companyId);

    /** Lấy toàn bộ lịch sử đăng ký của công ty(chưa xoá) */
    List<SubscriptionOfCompany> findByCompanyIdAndDeletedFalse(String companyId);

    /** Tìm gói đăng ký dựa trên ID công ty và trạng thái */
    Optional<SubscriptionOfCompany> findByCompanyIdAndStatus(String id, SubscriptionOfCompanyStatus status);

    /** Tìm tất cả gói đăng ký đã vượt quá ngày kết thúc (EndDate) */
    List<SubscriptionOfCompany> findAllByEndDateBefore(LocalDateTime now);

    /** Tìm các gói cước hết hạn nhưng ngoại trừ một loại tên gói cụ thể */
    List<SubscriptionOfCompany> findAllByEndDateBeforeAndStatusAndNameNot(
            LocalDateTime date,
            SubscriptionOfCompanyStatus status,
            SubscriptionPlanStatus name
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