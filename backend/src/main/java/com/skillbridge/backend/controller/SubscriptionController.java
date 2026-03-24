package com.skillbridge.backend.controller;


import com.skillbridge.backend.dto.request.CompanySubscriptionRequest;
import com.skillbridge.backend.dto.response.ApiResponse;
import com.skillbridge.backend.entity.SubscriptionOfCompany;
import com.skillbridge.backend.entity.SubscriptionPlan;
import com.skillbridge.backend.service.SubscriptionService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/subscription")
public class SubscriptionController {
    SubscriptionService subscriptionService;

    @GetMapping("/list")
    public ResponseEntity<List<SubscriptionPlan>> getAllSubscriptions() {
        return ResponseEntity.ok(subscriptionService.getAllSubscriptionPlans());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SubscriptionPlan> getSubscriptionById(
            @PathVariable("id") String id
    ) {
        return ResponseEntity.ok(subscriptionService.getSubscriptionPlanById(id));
    }

    @PostMapping("/company/create")
    public ResponseEntity<SubscriptionOfCompany> createCompanySubscription(
            @Valid @RequestBody CompanySubscriptionRequest companySubscriptionRequest
    ) {
        SubscriptionOfCompany companySubscriptions = subscriptionService.createCompanySubscriptions(companySubscriptionRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(companySubscriptions);
    }

    @DeleteMapping("/company/delete/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCompanySubscription(
            @PathVariable("id") String id
    ) {
        subscriptionService.deleteCompanySubscription(id);
        return ResponseEntity.ok(
            new ApiResponse<>(
                200,
                "Xóa gói đăng ký thành công",
                null
            )
        );
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<SubscriptionPlan> updateSubscription(
            @PathVariable("id") String id,
            @RequestBody SubscriptionPlan subscriptionPlan
    ) {
        SubscriptionPlan sub = subscriptionService.updateSubscription(id, subscriptionPlan);
        return ResponseEntity.ok(sub);
    }

    @GetMapping("/company/list")
    public ResponseEntity<List<SubscriptionOfCompany>> getAllSubscriptionPlans() {
        return ResponseEntity.ok(subscriptionService.getMyCompanySubscriptions());
    }
}