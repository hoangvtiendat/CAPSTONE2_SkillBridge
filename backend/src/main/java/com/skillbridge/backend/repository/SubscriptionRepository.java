package com.skillbridge.backend.repository;

import com.skillbridge.backend.entity.SubscriptionPlan;
import com.skillbridge.backend.enums.SubscriptionPlanStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SubscriptionRepository extends JpaRepository<SubscriptionPlan, String> {
    /** Tìm kiếm thông tin chi tiết của một gói dịch vụ dựa trên tên gói (Enum) */
    Optional<SubscriptionPlan> findByName(SubscriptionPlanStatus name);
}
