package com.skillbridge.backend.service;

import com.skillbridge.backend.config.CustomUserDetails;
import com.skillbridge.backend.dto.request.CompanySubscriptionRequest;
import com.skillbridge.backend.entity.Company;
import com.skillbridge.backend.entity.SubcriptionOfCompany;
import com.skillbridge.backend.entity.SubscriptionPlan;
import com.skillbridge.backend.enums.CompanyRole;
import com.skillbridge.backend.enums.SubscriptionOfCompanyStatus;
import com.skillbridge.backend.enums.SubscriptionPlanStatus;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.repository.CompanyMemberRepository;
import com.skillbridge.backend.repository.SubcriptionOfCompanyRepository;
import com.skillbridge.backend.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.View;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SubscriptionService {
    @Autowired
    SubscriptionRepository subscriptionRepository;
    @Autowired
    SubcriptionOfCompanyRepository companySubcriptionRespository;
    @Autowired
    CompanyMemberRepository companyMemberRepository;
    @Autowired
    private View error;
    public List<SubscriptionPlan> getAllSubscriptionPlans() {
        return subscriptionRepository.findAll();
    }
    public SubscriptionPlan getSubscriptionPlanById(String id) {
        return subscriptionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND_SUBSCRIPTION));
    }
    public SubscriptionPlan updateSubscription(String id, SubscriptionPlan subscriptionPlan) {

        SubscriptionPlan updatedSubscriptionPlan = getSubscriptionPlanById(id);
        SubscriptionPlanStatus status_name = updatedSubscriptionPlan.getName();

        LogicUpdateForUpdatescription(status_name, subscriptionPlan);
        updatedSubscriptionPlan.setPrice(subscriptionPlan.getPrice());
        updatedSubscriptionPlan.setPostingDuration(subscriptionPlan.getPostingDuration());
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

    public SubcriptionOfCompany createCompanySubscriptions(CompanySubscriptionRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        var recruiter = companyMemberRepository.findByUser_Id(userDetails.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.MEMBER_NOT_FOUND));

        if (!CompanyRole.ADMIN.equals(recruiter.getRole())) {
            throw new AppException(ErrorCode.EXITS_YOUR_ROLE);
        }
        SubscriptionPlan premium = subscriptionRepository.findByName(SubscriptionPlanStatus.PREMIUM)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND_SUBSCRIPTION));

        Company currentCompany = recruiter.getCompany();

        BigDecimal calculatedPrice = priceForCompanySubscriptions(request);

        SubcriptionOfCompany newSubscription = new SubcriptionOfCompany();
        newSubscription.setCompany(currentCompany);
        newSubscription.setName(SubscriptionPlanStatus.CUSTOM);
        newSubscription.setJobLimit(request.getJobLimit());
        newSubscription.setCandidateViewLimit(request.getCandidateViewLimit());
        newSubscription.setHasPriorityDisplay(request.getHasPriorityDisplay());
        newSubscription.setPrice(calculatedPrice);
        newSubscription.setStatus(SubscriptionOfCompanyStatus.PENDING_PAYMENT);
        newSubscription.setPostingDuration(premium.getPostingDuration());
        newSubscription.setStartDate(LocalDateTime.now());
        newSubscription.setEndDate(LocalDateTime.now().plusDays(30));
        newSubscription.setIsActive(true);

        return companySubcriptionRespository.save(newSubscription);
    }

    public BigDecimal priceForCompanySubscriptions(CompanySubscriptionRequest request)
    {
        SubscriptionPlan premium = subscriptionRepository.findByName(SubscriptionPlanStatus.PREMIUM)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND_SUBSCRIPTION));

        BigDecimal premiumPrice = premium.getPrice();
        int premJobLimit = premium.getJobLimit();
        int premViewLimit = premium.getCandidateViewLimit();

        if (request.getJobLimit() <= 0 || request.getCandidateViewLimit() <= 0) {
            throw new AppException(ErrorCode.INVALID_CUSTOM_LIMITS);
        }

        double requestRatio = (double) request.getCandidateViewLimit() / request.getJobLimit();

        double minRatio = 8.0;
        double maxRatio = 12.0;

        if (requestRatio < minRatio || requestRatio > maxRatio) {
            throw new AppException(ErrorCode.UNBALANCED_CUSTOM_PLAN);
        }


        BigDecimal unitJobPrice = premiumPrice.multiply(new BigDecimal("0.70"))
                .divide(new BigDecimal(premJobLimit), 4, RoundingMode.HALF_UP);

        BigDecimal unitViewPrice = premiumPrice.multiply(new BigDecimal("0.25"))
                .divide(new BigDecimal(premViewLimit), 4, RoundingMode.HALF_UP);

        BigDecimal priorityFixedPrice = premiumPrice.multiply(new BigDecimal("0.05"));

        BigDecimal customJobCost;
        if (request.getJobLimit() <= premJobLimit) {
            customJobCost = unitJobPrice.multiply(new BigDecimal(request.getJobLimit()));
        } else {
            BigDecimal baseJobCost = unitJobPrice.multiply(new BigDecimal(premJobLimit));
            int extraJobs = request.getJobLimit() - premJobLimit;
            BigDecimal extraJobCost = unitJobPrice.multiply(new BigDecimal("0.90")).multiply(new BigDecimal(extraJobs));
            customJobCost = baseJobCost.add(extraJobCost);
        }

        BigDecimal customViewCost;
        if (request.getCandidateViewLimit() <= premViewLimit) {
            customViewCost = unitViewPrice.multiply(new BigDecimal(request.getCandidateViewLimit()));
        } else {
            BigDecimal baseViewCost = unitViewPrice.multiply(new BigDecimal(premViewLimit));
            int extraViews = request.getCandidateViewLimit() - premViewLimit;
            BigDecimal extraViewCost = unitViewPrice.multiply(new BigDecimal("0.90")).multiply(new BigDecimal(extraViews));
            customViewCost = baseViewCost.add(extraViewCost);
        }

        BigDecimal totalPriorityCost = Boolean.TRUE.equals(request.getHasPriorityDisplay())
                ? priorityFixedPrice
                : BigDecimal.ZERO;

        return customJobCost.add(customViewCost).add(totalPriorityCost)
                .setScale(2, RoundingMode.HALF_UP);
    }
    public void deleteCompanySubscription(String subscriptionId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

        var recruiter = companyMemberRepository.findByUser_Id(userDetails.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.MEMBER_NOT_FOUND));

        if (!CompanyRole.ADMIN.equals(recruiter.getRole())) {
            throw new AppException(ErrorCode.EXITS_YOUR_ROLE);
        }

        SubcriptionOfCompany subscription = companySubcriptionRespository.findById(subscriptionId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND_SUBSCRIPTION));

        if (!subscription.getCompany().getId().equals(recruiter.getCompany().getId())) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }

        companySubcriptionRespository.delete(subscription);
;
    }
    public List<SubcriptionOfCompany> getMyCompanySubscriptions() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

        var recruiter = companyMemberRepository.findByUser_Id(userDetails.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.MEMBER_NOT_FOUND));

        if (!CompanyRole.ADMIN.equals(recruiter.getRole())) {
            throw new AppException(ErrorCode.EXITS_YOUR_ROLE);
        }
        return companySubcriptionRespository.findByCompanyId(recruiter.getCompany().getId());

    }

}