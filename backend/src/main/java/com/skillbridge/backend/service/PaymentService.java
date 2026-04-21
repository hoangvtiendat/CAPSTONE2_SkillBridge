package com.skillbridge.backend.service;
import com.skillbridge.backend.enums.JobStatus;
import com.skillbridge.backend.exception.AppException;

import com.skillbridge.backend.config.CustomUserDetails;
import com.skillbridge.backend.entity.Company;
import com.skillbridge.backend.entity.PaymentTransaction;
import com.skillbridge.backend.entity.SubscriptionOfCompany;
import com.skillbridge.backend.entity.SubscriptionPlan;
import com.skillbridge.backend.enums.CompanyRole;
import com.skillbridge.backend.enums.SubscriptionOfCompanyStatus;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.repository.*;
import com.skillbridge.backend.utils.SecurityUtils;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import vn.payos.PayOS;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;

import vn.payos.model.webhooks.Webhook;
import vn.payos.model.webhooks.WebhookData;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PaymentService {
    PayOS payOS;
    CompanyMemberRepository companyMemberRepository;
    SubscriptionOfCompanyRepository subscriptionOfCompanyRepository;
    SubscriptionPlanRepository subscriptionPlanRepository;
    PaymentTransactionRepository paymentTransactionRepository;
    CompanyRepository companyRepository;
    JobRepository jobRepository;
    SystemLogService systemLog;
    SecurityUtils securityUtils;
    SimpMessagingTemplate messagingTemplate;

    /**
     * Tạo liên kết thanh toán PayOS cho gói dịch vụ
     */
    @Transactional
    public String createPaymentLink(String id_ofBill, int type) throws Exception {
        CustomUserDetails currentUser = securityUtils.getCurrentUser();

        var recruiter = companyMemberRepository.findByUser_Id(currentUser.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.MEMBER_NOT_FOUND));

        if (!CompanyRole.ADMIN.equals(recruiter.getRole())) {
            systemLog.danger(currentUser, "Cố gắng thanh toán trái phép gói dịch vụ");
            throw new AppException(ErrorCode.EXITS_YOUR_ROLE);
        }

        BigDecimal amount = BigDecimal.ZERO;
        String description = "";
        String idOfSubcriptionOfCompany = "";
        String planName;
        String subscriptionPlanId;
        if (type == 0) {
            SubscriptionPlan getDetailSub = subscriptionPlanRepository.getReferenceById(id_ofBill);
            idOfSubcriptionOfCompany = getDetailSub.getId();
            amount = getDetailSub.getPrice();
            planName = getDetailSub.getName().toString();
            subscriptionPlanId = id_ofBill;
        } else if (type == 1) {
            SubscriptionOfCompany getDetailSub = subscriptionOfCompanyRepository.getReferenceById(id_ofBill);
            idOfSubcriptionOfCompany = getDetailSub.getId();
            amount = getDetailSub.getPrice();
            planName = "CUSTOM PLAN";
            subscriptionPlanId = null;
        } else {
            throw new AppException(ErrorCode.INVALID_CUSTOM_LIMITS);
        }
        Map<String, Object> dataOfSubscription = new HashMap<>();
        dataOfSubscription.put("id_of_bill", id_ofBill);
        dataOfSubscription.put("type", type);

        long orderCode = System.currentTimeMillis() / 1000;

        CreatePaymentLinkRequest paymentRequest = CreatePaymentLinkRequest.builder()
                .orderCode(orderCode)
                .amount(amount.longValue())
                .description(description)
                .cancelUrl("http://localhost:3000/company/subscriptions")
                .returnUrl("http://localhost:3000/company/subscriptions")
                .build();

        PaymentTransaction transaction = new PaymentTransaction();
        transaction.setType(type);
        transaction.setSubscriptionId(idOfSubcriptionOfCompany);
        transaction.setOrderCode(orderCode);
        transaction.setCompanyId(recruiter.getCompany().getId());
        ///  Laasy ID goi mac dinh
        transaction.setIdOfSubscription(subscriptionPlanId);
        paymentTransactionRepository.save(transaction);
        System.out.println("transaction" + transaction);
        systemLog.info(currentUser, "Khởi tạo thanh toán gói " + planName + " - Số tiền: " + amount);

        return payOS.paymentRequests().create(paymentRequest).getCheckoutUrl();
    }

    /**
     * Xác thực dữ liệu Webhook gửi từ PayOS
     */
    public WebhookData verifyWebhook(Webhook webhook) throws Exception {
        return payOS.webhooks().verify(webhook);
    }

    /**
     * Xử lý logic khi thanh toán thành công (Webhook Callback)
     */
    @Transactional
    public void handleSuccessfulPayment(WebhookData data) {
        long orderCode = data.getOrderCode();
        String code = data.getCode();
        if (orderCode == 123) {
            return;
        }
        if ("00".equals(code)) {
            try {
                PaymentTransaction transaction = paymentTransactionRepository.findById(orderCode)
                        .orElseThrow(() -> new Exception("Không tìm thấy giao dịch: " + orderCode));

                subscriptionOfCompanyRepository.findByCompanyIdAndStatus(transaction.getCompanyId(), SubscriptionOfCompanyStatus.OPEN)
                        .ifPresent(oldSub -> {
                            oldSub.setStatus(SubscriptionOfCompanyStatus.CLOSE);
                            subscriptionOfCompanyRepository.save(oldSub);
                        });

                if (transaction.getType() == 0) {
                    activateStandardPlan(transaction);
                } else if (transaction.getType() == 1) {
                    activateCustomPlan(transaction);
                }

                systemLog.info(null, "Giao dịch #" + orderCode + " hoàn tất. Công ty ID: " + transaction.getCompanyId() + " đã được nâng cấp.");
                messagingTemplate.convertAndSend("/topic/payments", "SUCCESS:" + orderCode);

            } catch (Exception e) {
                log.error("Lỗi xử lý kích hoạt gói sau thanh toán: ", e);
                throw new AppException(ErrorCode.CHECK_STATUS_SUB);
            }
        }
    }

    private void activateStandardPlan(PaymentTransaction transaction) {
        SubscriptionPlan plan = subscriptionPlanRepository.getReferenceById(transaction.getSubscriptionId());
        Company company = companyRepository.getReferenceById(transaction.getCompanyId());

        SubscriptionOfCompany newSub = new SubscriptionOfCompany();
        newSub.setCompany(company);
        newSub.setName(plan.getName());
        newSub.setJobLimit(plan.getJobLimit());
        newSub.setCandidateViewLimit(plan.getCandidateViewLimit());
        newSub.setHasPriorityDisplay(plan.getHasPriorityDisplay());
        newSub.setPrice(plan.getPrice());
        newSub.setStatus(SubscriptionOfCompanyStatus.OPEN);
        newSub.setPostingDuration(plan.getPostingDuration());
        newSub.setStartDate(LocalDateTime.now());
        newSub.setEndDate(LocalDateTime.now().plusMonths(plan.getPostingDuration() != null ? plan.getPostingDuration() : 1));
        newSub.setIsActive(true);
        newSub.setSubscriptionPlan_id(transaction.getIdOfSubscription());

        updateJobDurations(transaction.getCompanyId(), plan.getPostingDuration());
        subscriptionOfCompanyRepository.save(newSub);
    }

    private void activateCustomPlan(PaymentTransaction transaction) {
        SubscriptionOfCompany customSub = subscriptionOfCompanyRepository.getReferenceById(transaction.getSubscriptionId());
        customSub.setStatus(SubscriptionOfCompanyStatus.OPEN);
        customSub.setStartDate(LocalDateTime.now());
        customSub.setEndDate(LocalDateTime.now().plusMonths(customSub.getPostingDuration() != null ? customSub.getPostingDuration() : 1));

        updateJobDurations(transaction.getCompanyId(), customSub.getPostingDuration());
        subscriptionOfCompanyRepository.save(customSub);
    }

    private void updateJobDurations(String companyId, Integer duration) {
        jobRepository.updateDurationForOldJobs(
                companyId,
                duration,
                List.of(JobStatus.OPEN, JobStatus.PENDING)
        );
    }
}