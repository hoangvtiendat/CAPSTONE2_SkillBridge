package com.skillbridge.backend.repository;

import com.skillbridge.backend.entity.SubscriptionPlan;
import com.skillbridge.backend.enums.SubscriptionPlanStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SubscriptionRepository extends JpaRepository<SubscriptionPlan, String> {
    Optional<SubscriptionPlan> findByName(SubscriptionPlanStatus name);
}
