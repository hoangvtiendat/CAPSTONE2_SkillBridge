package com.skillbridge.backend.repository;
import com.skillbridge.backend.entity.SubscriptionPlan;
import com.skillbridge.backend.enums.SubscriptionPlanStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, String> {
}
