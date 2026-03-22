package com.skillbridge.backend.controller;

import com.skillbridge.backend.service.PaymentService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.payos.model.webhooks.Webhook;
import vn.payos.model.webhooks.WebhookData;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/payments")
@CrossOrigin("*")
public class PaymentController {
    PaymentService paymentService;

    /**
     * Tạo link thanh toán PayOS
     * */
    @PostMapping("/create-link/{id}/{type}")
    public ResponseEntity<?> createPaymentLink(
            @PathVariable("id") String id,
            @PathVariable("type") int typeBill
    ) {
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

    /**
     * Webhook nhận thông báo kết quả thanh toán từ PayOS
     * Không nên trả về ApiResponse cho Webhook, chỉ cần String hoặc HttpStatus theo tài liệu PayOS
     */
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