package com.skillbridge.backend.service;
import com.skillbridge.backend.dto.response.JobResponse;
import com.skillbridge.backend.enums.JobStatus;
import com.skillbridge.backend.exception.AppException;

import com.skillbridge.backend.config.CustomUserDetails;
import com.skillbridge.backend.entity.Company;
import com.skillbridge.backend.entity.PaymentTransaction;
import com.skillbridge.backend.entity.SubcriptionOfCompany;
import com.skillbridge.backend.entity.SubscriptionPlan;
import com.skillbridge.backend.enums.CompanyRole;
import com.skillbridge.backend.enums.SubscriptionOfCompanyStatus;
import com.skillbridge.backend.enums.SubscriptionPlanStatus;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.repository.*;
import jakarta.transaction.Transactional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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
public class PaymentService {

    private final PayOS payOS;
    private final CompanyMemberRepository companyMemberRepository;
    private final SubcriptionOfCompanyRepository subcriptionOfCompanyRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final CompanyRepository companyRepository;
    private final JobRepository jobRepository;

    public PaymentService(PayOS payOS, CompanyMemberRepository companyMemberRepository, SubcriptionOfCompanyRepository subcriptionOfCompanyRepository,
                          SubscriptionPlanRepository subscriptionPlanRepository,
                          PaymentTransactionRepository paymentTransactionReposit, CompanyRepository companyRepository
            , JobRepository jobRepository) {
        this.payOS = payOS;
        this.companyMemberRepository = companyMemberRepository;
        this.subcriptionOfCompanyRepository = subcriptionOfCompanyRepository;
        this.subscriptionPlanRepository = subscriptionPlanRepository;
        this.paymentTransactionRepository = paymentTransactionReposit;
        this.companyRepository = companyRepository;
        this.jobRepository = jobRepository;
    }


    public String createPaymentLink(String id_ofBill, int type) throws Exception {
        long orderCode = System.currentTimeMillis() / 1000;
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
        BigDecimal amount = BigDecimal.ZERO;
        String description = "";
        String idOfSubcriptionOfCompany = "";
        if (type == 0) {
            SubscriptionPlan getDetailSub = subscriptionPlanRepository.getReferenceById(id_ofBill);
            idOfSubcriptionOfCompany = getDetailSub.getId();
            amount = getDetailSub.getPrice();
        } else if (type == 1) {
            SubcriptionOfCompany getDetailSub = subcriptionOfCompanyRepository.getReferenceById(id_ofBill);
            idOfSubcriptionOfCompany = getDetailSub.getId();
            amount = getDetailSub.getPrice();
        } else {
            throw new Exception("Loại hóa đơn không hợp lệ, không thể xác định số tiền!");
        }
        Map<String, Object> dataOfSubcription = new HashMap<>();
        dataOfSubcription.put("id_of_bill", id_ofBill);
        dataOfSubcription.put("type", type);

        System.out.println("DEBUG: ID = " + id_ofBill + " | Amount lấy được từ DB = " + amount);

        CreatePaymentLinkRequest paymentRequest = CreatePaymentLinkRequest.builder()
                .orderCode(orderCode)
                .amount(amount.longValue())
                .description(description)
                .cancelUrl("http://localhost:3000/company/subscriptions")
                .returnUrl("http://localhost:3000/company/subscriptions")
                .build();
        PaymentTransaction transaction = new PaymentTransaction();
        transaction.setType(type);
        transaction.setSubscription_id(idOfSubcriptionOfCompany);
        transaction.setOrderCode(orderCode);
        transaction.setCompanyId(recruiter.getCompany().getId());
        paymentTransactionRepository.save(transaction);
        return payOS.paymentRequests().create(paymentRequest).getCheckoutUrl();
    }


    public WebhookData verifyWebhook(Webhook webhook) throws Exception {
        return payOS.webhooks().verify(webhook);
    }

    @Transactional
    public void handleSuccessfulPayment(WebhookData data) {
        long orderCode = data.getOrderCode();
        String code = data.getCode();
        Long amount = data.getAmount();

        try {
            System.out.println("Đang xử lý chức năng cho mã đơn hàng: " + orderCode);
            System.out.println("Mã trạng thái giao dịch: " + code);
            System.out.println("Số tiền nhận được: " + amount);
            System.out.println("data: " + data);

            if (orderCode == 123) {
                return;
            }

            if ("00".equals(code)) {
                PaymentTransaction paymentTransaction = paymentTransactionRepository.findById(orderCode)
                        .orElseThrow(() -> new Exception("Không tìm thấy giao dịch với mã: " + orderCode));

                subcriptionOfCompanyRepository.findByCompanyIdAndStatus(paymentTransaction.getCompanyId(), SubscriptionOfCompanyStatus.OPEN)
                        .ifPresent(closeSub -> {
                            closeSub.setStatus(SubscriptionOfCompanyStatus.CLOSE);
                            subcriptionOfCompanyRepository.save(closeSub);
                        });

                if (paymentTransaction.getType() == 0) {
                    SubscriptionPlan getSub = subscriptionPlanRepository.getReferenceById(paymentTransaction.getSubscription_id());
                    String companyId = paymentTransaction.getCompanyId();
                    SubcriptionOfCompany newSubscription = new SubcriptionOfCompany();
                    Company company = companyRepository.getReferenceById(companyId);

                    newSubscription.setCompany(company);
                    newSubscription.setName(getSub.getName());
                    newSubscription.setJobLimit(getSub.getJobLimit());
                    newSubscription.setCandidateViewLimit(getSub.getCandidateViewLimit());
                    newSubscription.setHasPriorityDisplay(getSub.getHasPriorityDisplay());
                    newSubscription.setPrice(getSub.getPrice());
                    newSubscription.setStatus(SubscriptionOfCompanyStatus.OPEN);
                    newSubscription.setPostingDuration(getSub.getPostingDuration());
                    newSubscription.setStartDate(LocalDateTime.now());
                    newSubscription.setEndDate(LocalDateTime.now().plusMonths(getSub.getPostingDuration() != null ? getSub.getPostingDuration() : 1));
                    newSubscription.setIsActive(true);

                    jobRepository.updateDurationForOldJobs(
                            paymentTransaction.getCompanyId(),
                            getSub.getPostingDuration(),
                            List.of(
                                    JobStatus.OPEN, JobStatus.PENDING
                            )
                    );

                    subcriptionOfCompanyRepository.save(newSubscription);
                }

                if (paymentTransaction.getType() == 1) {
                    SubcriptionOfCompany getSub = subcriptionOfCompanyRepository.getReferenceById(paymentTransaction.getSubscription_id());
                    getSub.setStatus(SubscriptionOfCompanyStatus.OPEN);
                    getSub.setStartDate(LocalDateTime.now());
                    getSub.setEndDate(LocalDateTime.now().plusMonths(getSub.getPostingDuration() != null ? getSub.getPostingDuration() : 1));
                    jobRepository.updateDurationForOldJobs(
                            paymentTransaction.getCompanyId(),
                            getSub.getPostingDuration(),
                            List.of(
                                    JobStatus.OPEN, JobStatus.PENDING
                            )
                    );
                    subcriptionOfCompanyRepository.save(getSub);
                }

            } else {
                throw new AppException(ErrorCode.CHECK_STATUS_SUB);
            }

        } catch (Exception e) {
            e.printStackTrace();
            throw new AppException(ErrorCode.CHECK_STATUS_SUB);
        }
    }
}