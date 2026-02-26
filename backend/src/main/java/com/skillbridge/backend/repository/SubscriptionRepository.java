package com.skillbridge.backend.repository;

import com.skillbridge.backend.entity.SubscriptionPlan;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubscriptionRepository extends JpaRepository<SubscriptionPlan, String> {
}
