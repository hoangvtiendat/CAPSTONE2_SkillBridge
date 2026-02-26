package com.skillbridge.backend.service;

import com.skillbridge.backend.entity.SubscriptionPlan;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.repository.SubscriptionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

@Service
public class SubscriptionService {
    @Autowired
    SubscriptionRepository subscriptionRepository;
    public List<SubscriptionPlan> getAllSubscriptionPlans() {
        return subscriptionRepository.findAll();
    }
    public SubscriptionPlan getSubscriptionPlanById(String id) {
        return subscriptionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND_SUBSCRIPTTION));
    }
    public SubscriptionPlan Updatescription(String id, SubscriptionPlan subscriptionPlan) {
        SubscriptionPlan updatedSubscriptionPlan = getSubscriptionPlanById(id);

        updatedSubscriptionPlan.setPrice(subscriptionPlan.getPrice());
        updatedSubscriptionPlan.setJobLimit(subscriptionPlan.getJobLimit());
        updatedSubscriptionPlan.setCandidateViewLimit(subscriptionPlan.getCandidateViewLimit());
        updatedSubscriptionPlan.setHasPriorityDisplay(subscriptionPlan.getHasPriorityDisplay());
        return subscriptionRepository.save(updatedSubscriptionPlan);
    }
}
