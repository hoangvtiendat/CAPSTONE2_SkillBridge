package com.skillbridge.backend.repository;

import com.skillbridge.backend.entity.SubcriptionOfCompany;
import com.skillbridge.backend.enums.SubscriptionOfCompanyStatus;
import com.skillbridge.backend.enums.SubscriptionPlanStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import javax.swing.text.html.Option;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SubcriptionOfCompanyRepository extends JpaRepository<SubcriptionOfCompany, String> {


    List<SubcriptionOfCompany> findByCompanyId (String companyId);
    Optional<SubcriptionOfCompany> findByCompanyIdAndStatus(String id, SubscriptionOfCompanyStatus status);
    List<SubcriptionOfCompany> findAllByEndDateBefore(LocalDateTime now);

    List<SubcriptionOfCompany> findAllByEndDateBeforeAndStatusAndNameNot(LocalDateTime date, SubscriptionOfCompanyStatus status, SubscriptionPlanStatus name);

    List<SubcriptionOfCompany> findAllByEndDateBeforeAndStatusAndName(LocalDateTime date, SubscriptionOfCompanyStatus status, SubscriptionPlanStatus name);

    Optional<SubcriptionOfCompany> findById(String id);

    Optional<SubcriptionOfCompany> findByCompanyIdAndName(String companyId, SubscriptionPlanStatus name);
}