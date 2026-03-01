package com.skillbridge.backend.service;

import com.skillbridge.backend.entity.SubscriptionPlan;
import com.skillbridge.backend.enums.SubscriptionPlanStatus;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.repository.SubscriptionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.servlet.View;

import java.util.List;

@Service
public class SubscriptionService {
    @Autowired
    SubscriptionRepository subscriptionRepository;
    @Autowired
    private View error;

    public List<SubscriptionPlan> getAllSubscriptionPlans() {
        return subscriptionRepository.findAll();
    }
    public SubscriptionPlan getSubscriptionPlanById(String id) {
        return subscriptionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND_SUBSCRIPTION));
    }
    public SubscriptionPlan Updatescription(String id, SubscriptionPlan subscriptionPlan) {

        SubscriptionPlan updatedSubscriptionPlan = getSubscriptionPlanById(id);
        SubscriptionPlanStatus status_name = updatedSubscriptionPlan.getName();

        LogicUpdateForUpdatescription(status_name, subscriptionPlan);

        updatedSubscriptionPlan.setPrice(subscriptionPlan.getPrice());
        updatedSubscriptionPlan.setJobLimit(subscriptionPlan.getJobLimit());
        updatedSubscriptionPlan.setCandidateViewLimit(subscriptionPlan.getCandidateViewLimit());
        updatedSubscriptionPlan.setHasPriorityDisplay(subscriptionPlan.getHasPriorityDisplay());

        return subscriptionRepository.save(updatedSubscriptionPlan);
    }

    public void LogicUpdateForUpdatescription(SubscriptionPlanStatus status, SubscriptionPlan request) {
        if (SubscriptionPlanStatus.FREE.equals(status)) {
            SubscriptionPlan standard = subscriptionRepository.findByName(SubscriptionPlanStatus.STANDARD)
                    .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND_SUBSCRIPTION));

            if (request.getPrice() != null && request.getPrice().compareTo(java.math.BigDecimal.ZERO) != 0) {
                throw new AppException(ErrorCode.FREE_PRICE_CANNOT_BE_CHANGED);
            }
            if (Boolean.TRUE.equals(request.getHasPriorityDisplay())) {
                throw new AppException(ErrorCode.FREE_HAS_PRIORITY_DISPLAY_NOT_ALLOWED);
            }
            if (request.getJobLimit() > standard.getJobLimit()){
                throw new AppException(ErrorCode.FREE_JOB_LIMIT_EXCEEDS_STANDARD);
            }
            if (request.getCandidateViewLimit() > standard.getCandidateViewLimit()) {
                throw new AppException(ErrorCode.FREE_CANDIDATE_VIEW_LIMIT_EXCEEDS_STANDARD);
            }
        }
        else if (SubscriptionPlanStatus.STANDARD.equals(status)) {
            SubscriptionPlan premium = subscriptionRepository.findByName(SubscriptionPlanStatus.PREMIUM)
                    .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND_SUBSCRIPTION));
            SubscriptionPlan free = subscriptionRepository.findByName(SubscriptionPlanStatus.FREE)
                    .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND_SUBSCRIPTION));

            if (request.getPrice().compareTo(premium.getPrice()) > 0) {
                throw new AppException(ErrorCode.STANDARD_PRICE_EXCEEDS_PREMIUM);
            }
            if (request.getPrice().compareTo(free.getPrice()) <= 0) {
                throw new AppException(ErrorCode.STANDARD_PRICE_MUST_BE_GREATER_THAN_ZERO);
            }
            if (request.getJobLimit() < free.getJobLimit()){
                throw new AppException(ErrorCode.STANDARD_JOB_LIMIT_LOWER_THAN_FREE);
            }
            if (request.getJobLimit() > premium.getJobLimit()) {
                throw new AppException(ErrorCode.STANDARD_JOB_LIMIT_EXCEEDS_PREMIUM);
            }
            if (request.getCandidateViewLimit() < free.getCandidateViewLimit()){
                throw new AppException(ErrorCode.STANDARD_CANDIDATE_VIEW_LIMIT_LOWER_THAN_FREE);
            }
            if (request.getCandidateViewLimit() > premium.getCandidateViewLimit()){
                throw new AppException(ErrorCode.STANDARD_CANDIDATE_VIEW_LIMIT_EXCEEDS_PREMIUM);
            }
        }
        else if (SubscriptionPlanStatus.PREMIUM.equals(status)) {
            SubscriptionPlan standard = subscriptionRepository.findByName(SubscriptionPlanStatus.STANDARD)
                    .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND_SUBSCRIPTION));

            if (request.getPrice().compareTo(standard.getPrice()) < 0) {
                throw new AppException(ErrorCode.PREMIUM_PRICE_LOWER_THAN_STANDARD);
            }
            if (request.getJobLimit() < standard.getJobLimit()) {
                throw new AppException(ErrorCode.PREMIUM_JOB_LIMIT_LOWER_THAN_STANDARD);
            }
            if (request.getCandidateViewLimit() < standard.getCandidateViewLimit()) {
                throw new AppException(ErrorCode.PREMIUM_CANDIDATE_VIEW_LIMIT_LOWER_THAN_STANDARD);
            }
        }
    }
}
