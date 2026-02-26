package com.skillbridge.backend.controller;


import com.skillbridge.backend.entity.SubscriptionPlan;
import com.skillbridge.backend.service.SubscriptionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/subscription")

public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    public SubscriptionController(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @GetMapping("/list")
    public ResponseEntity<List<SubscriptionPlan>> getAllSubscriptions() {
        return ResponseEntity.ok(subscriptionService.getAllSubscriptionPlans());
    }
    @GetMapping("/{id}")
    public ResponseEntity<SubscriptionPlan> getSubscriptionById(@PathVariable("id") String id) {
        return ResponseEntity.ok(subscriptionService.getSubscriptionPlanById(id));
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<SubscriptionPlan> updateSubscription(
            @PathVariable("id") String id,
            @RequestBody SubscriptionPlan subscriptionPlan) {

        SubscriptionPlan sub = subscriptionService.Updatescription(id, subscriptionPlan);

        return ResponseEntity.ok(sub);
    }
}
