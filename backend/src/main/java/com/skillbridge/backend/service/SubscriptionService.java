package com.skillbridge.backend.service;

import com.skillbridge.backend.config.CustomUserDetails;
import com.skillbridge.backend.dto.request.CompanySubscriptionRequest;
import com.skillbridge.backend.entity.Company;
import com.skillbridge.backend.entity.SubscriptionOfCompany;
import com.skillbridge.backend.entity.SubscriptionPlan;
import com.skillbridge.backend.enums.CompanyRole;
import com.skillbridge.backend.enums.SubscriptionOfCompanyStatus;
import com.skillbridge.backend.enums.SubscriptionPlanStatus;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.repository.CompanyMemberRepository;
import com.skillbridge.backend.repository.SubscriptionOfCompanyRepository;
import com.skillbridge.backend.repository.SubscriptionRepository;
import com.skillbridge.backend.utils.SecurityUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class SubscriptionService {
    SubscriptionRepository subscriptionRepository;
    SubscriptionOfCompanyRepository subcriptionOfCompanyRepository;
    CompanyMemberRepository companyMemberRepository;
    SystemLogService systemLog;
    SecurityUtils securityUtils;
    SimpMessagingTemplate messagingTemplate;

    /**
     * Lấy danh sách tất cả gói dịch vụ hiện có
     */
    public List<SubscriptionPlan> getAllSubscriptionPlans() {
        return subscriptionRepository.findAll();
    }

    /**
     * Tìm gói dịch vụ theo ID
     */
    public SubscriptionPlan getSubscriptionPlanById(String id) {
        return subscriptionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND_SUBSCRIPTION));
    }

    /**
     * Cập nhật thông tin gói dịch vụ (có ràng buộc logic giữa các gói)
     */
    @Transactional
    public SubscriptionPlan updateSubscription(String id, SubscriptionPlan subscriptionPlan) {
        SubscriptionPlan plan = subscriptionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND_SUBSCRIPTION));
        SubscriptionPlanStatus status_name = plan.getName();
        LogicUpdateForUpdateSubscription(status_name, subscriptionPlan);
        plan.setPrice(subscriptionPlan.getPrice());
        plan.setPostingDuration(subscriptionPlan.getPostingDuration());
        plan.setJobLimit(subscriptionPlan.getJobLimit());
        plan.setCandidateViewLimit(subscriptionPlan.getCandidateViewLimit());
        plan.setHasPriorityDisplay(subscriptionPlan.getHasPriorityDisplay());
        plan.setIsPublic(subscriptionPlan.getIsPublic());

        SubscriptionPlan savedPlan = subscriptionRepository.save(plan);

        CustomUserDetails currentUser = securityUtils.getCurrentUser();
        systemLog.warn(currentUser, "Cấu hình gói " + savedPlan.getName() + " đã thay đổi");

        messagingTemplate.convertAndSend("/topic/subscription-plans", savedPlan);

        return savedPlan;
    }

    public void LogicUpdateForUpdateSubscription(SubscriptionPlanStatus status, SubscriptionPlan request) {
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

    /**
     * Tạo đăng ký gói Custom cho Công ty
     */
    public SubscriptionOfCompany createCompanySubscriptions(CompanySubscriptionRequest request) {
        CustomUserDetails currentUser = securityUtils.getCurrentUser();

        var recruiter = companyMemberRepository.findByUser_Id(currentUser.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.MEMBER_NOT_FOUND));

        if (!CompanyRole.ADMIN.equals(recruiter.getRole())) {
            systemLog.danger(currentUser, "Cố gắng tạo gói đăng ký Custom trái phép");
            throw new AppException(ErrorCode.EXITS_YOUR_ROLE);
        }
        SubscriptionPlan premium = subscriptionRepository.findByName(SubscriptionPlanStatus.PREMIUM)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND_SUBSCRIPTION_PRENIUM));

        Company currentCompany = recruiter.getCompany();

        BigDecimal calculatedPrice = priceForCompanySubscriptions(request);

        SubscriptionOfCompany newSubscription = new SubscriptionOfCompany();
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


        SubscriptionOfCompany saved = subcriptionOfCompanyRepository.save(newSubscription);

        systemLog.info(currentUser, "Đăng ký gói Custom mới cho công ty: " + recruiter.getCompany().getName());

        String companyTopic = "/topic/company/" + recruiter.getCompany().getId() + "/subscriptions";
        messagingTemplate.convertAndSend(companyTopic, saved);

        return saved;
    }

    public BigDecimal priceForCompanySubscriptions(CompanySubscriptionRequest request) {
        SubscriptionPlan premium = subscriptionRepository.findByName(SubscriptionPlanStatus.PREMIUM)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND_SUBSCRIPTION));

        BigDecimal premiumPrice = premium.getPrice();
        int premJobLimit = premium.getJobLimit();
        int premViewLimit = premium.getCandidateViewLimit();

        if (request.getJobLimit() <= 0 || request.getCandidateViewLimit() <= 0) {
            throw new AppException(ErrorCode.INVALID_CUSTOM_LIMITS);
        }


        BigDecimal unitJobPrice = premiumPrice.multiply(new BigDecimal("0.40"))
                .divide(new BigDecimal(premJobLimit), 4, RoundingMode.HALF_UP);

        BigDecimal unitViewPrice = premiumPrice.multiply(new BigDecimal("0.60"))
                .divide(new BigDecimal(premViewLimit), 4, RoundingMode.HALF_UP);


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

        return customJobCost.add(customViewCost).setScale(2, RoundingMode.HALF_UP);
    }
    /**
     * Xóa (Hủy) gói dịch vụ của công ty
     */
    public void deleteCompanySubscription(String subscriptionId) {
        CustomUserDetails currentUser = securityUtils.getCurrentUser();

        var recruiter = companyMemberRepository.findByUser_Id(currentUser.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.MEMBER_NOT_FOUND));

        if (!CompanyRole.ADMIN.equals(recruiter.getRole())) {
            systemLog.danger(currentUser, "Vi phạm phân quyền: User cố gắng xóa gói dịch vụ");
            throw new AppException(ErrorCode.EXITS_YOUR_ROLE);
        }

        SubscriptionOfCompany subscription = subcriptionOfCompanyRepository.findById(subscriptionId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND_SUBSCRIPTION));

        if (!subscription.getCompany().getId().equals(recruiter.getCompany().getId())) {
            systemLog.danger(currentUser, "Cảnh báo bảo mật: Cố gắng xóa gói của công ty khác ID: " + subscriptionId);
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }

        subscription.setIsActive(false);
        subscription.setDeleted(true);

        subcriptionOfCompanyRepository.save(subscription);

        systemLog.warn(currentUser, "Xóa gói dịch vụ ID: " + subscriptionId);

        String companyTopic = "/topic/company/" + recruiter.getCompany().getId() + "/subscriptions";
        messagingTemplate.convertAndSend(companyTopic, "DELETED:" + subscriptionId);
    }

    public List<SubscriptionOfCompany> getMyCompanySubscriptions() {
        CustomUserDetails currentUser = securityUtils.getCurrentUser();
        try {
            var recruiter = companyMemberRepository.findByUser_Id(currentUser.getUserId())
                    .orElseThrow(() -> new AppException(ErrorCode.MEMBER_NOT_FOUND));

            List<SubscriptionOfCompany> subscriptions = subcriptionOfCompanyRepository.findByCompanyId(recruiter.getCompany().getId());

            return subscriptions;

        } catch (AppException e) {
            systemLog.danger(currentUser, "Lỗi hệ thống: " + e.getMessage());
            throw e;
        } catch (Exception e) {
            systemLog.danger(currentUser, "Lỗi hệ thống: " + e.getMessage());
            throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }
    ///  Lấy ngày đăng
    public int getJobDay(String id_company) {
        return subcriptionOfCompanyRepository.findPostingDuration(id_company, SubscriptionOfCompanyStatus.OPEN)
                .orElse(0);
    }
}