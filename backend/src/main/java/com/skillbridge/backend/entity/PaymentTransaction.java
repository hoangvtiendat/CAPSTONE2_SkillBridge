package com.skillbridge.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "payment_transactions")
public class PaymentTransaction extends BaseEntity {

    @Id
    @Column(name = "order_code")
    private Long orderCode;

    @Column(name = "subscription_id", length = 36)
    private String subscriptionId;

    @Column(name = "company_id", length = 36)
    private String companyId;

    @Column(nullable = false)
    private int type;

    // Gợi ý thêm các trường quan trọng để đối soát
    @Column(precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(length = 20)
    private String status; // PENDING, PAID, CANCELLED
}