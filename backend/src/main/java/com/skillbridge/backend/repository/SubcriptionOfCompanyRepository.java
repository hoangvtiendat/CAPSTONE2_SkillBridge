package com.skillbridge.backend.repository;

import com.skillbridge.backend.entity.SubcriptionOfCompany;
import com.skillbridge.backend.enums.JobStatus;
import com.skillbridge.backend.enums.SubscriptionOfCompanyStatus;
import com.skillbridge.backend.enums.SubscriptionPlanStatus;
import jakarta.persistence.LockModeType;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import javax.swing.text.html.Option;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SubcriptionOfCompanyRepository extends JpaRepository<SubcriptionOfCompany, String> {
    /** Lấy toàn bộ lịch sử đăng ký của một công ty */
    List<SubcriptionOfCompany> findByCompanyId (String companyId);

    /** Lấy toàn bộ lịch sử đăng ký của công ty(chưa xoá) */
    List<SubcriptionOfCompany> findByCompanyIdAndDeletedFalse(String companyId);

    /** Tìm gói đăng ký dựa trên ID công ty và trạng thái */
    Optional<SubcriptionOfCompany> findByCompanyIdAndStatus(String id, SubscriptionOfCompanyStatus status);

    /** Tìm tất cả gói đăng ký đã vượt quá ngày kết thúc (EndDate) */
    List<SubcriptionOfCompany> findAllByEndDateBefore(LocalDateTime now);

    /** Tìm các gói cước hết hạn nhưng ngoại trừ một loại tên gói cụ thể */
    List<SubcriptionOfCompany> findAllByEndDateBeforeAndStatusAndNameNot(
            LocalDateTime date,
            SubscriptionOfCompanyStatus status,
            SubscriptionPlanStatus name
    );

    /** Tìm các gói cước hết hạn theo chính xác trạng thái và tên gói */
    List<SubcriptionOfCompany> findAllByEndDateBeforeAndStatusAndName(
            LocalDateTime date,
            SubscriptionOfCompanyStatus status,
            SubscriptionPlanStatus name
    );

    /** Tìm kiếm gói đăng ký cụ thể dựa trên ID công ty và tên loại gói */
    Optional<SubcriptionOfCompany> findByCompanyIdAndName(String companyId, SubscriptionPlanStatus name);
}