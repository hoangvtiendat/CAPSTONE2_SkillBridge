package com.skillbridge.backend.controller;

import com.skillbridge.backend.service.PaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.payos.model.webhooks.Webhook;
import vn.payos.model.webhooks.WebhookData;

import java.util.Map;

@RestController
@RequestMapping("/payments")
@CrossOrigin("*")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/create-link/{id}/{type}")
    public ResponseEntity<?> createPaymentLink(@PathVariable("id") String id, @PathVariable("type") int typeBill) {
        try {

            String checkoutUrl = paymentService.createPaymentLink(id, typeBill);

            return ResponseEntity.ok(Map.of("checkoutUrl", checkoutUrl));
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body("Định dạng số không hợp lệ: " + e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Lỗi hệ thống: " + e.getMessage());
        }
    }


    @PostMapping("/webhook")
    public ResponseEntity<?> handleWebhook(@RequestBody Webhook webhook) {
        try {
            WebhookData data = paymentService.verifyWebhook(webhook);

            paymentService.handleSuccessfulPayment(data);

            return ResponseEntity.ok("Xác nhận thành công");

        } catch (Exception e) {
            System.err.println("Lỗi Webhook: " + e.getMessage());
            return ResponseEntity.badRequest().body("Webhook verify fail");
        }
    }
}