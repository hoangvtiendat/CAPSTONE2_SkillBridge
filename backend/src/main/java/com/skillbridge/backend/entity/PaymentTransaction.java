package com.skillbridge.backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class PaymentTransaction {
    @Id
    private Long orderCode;

    private String Subscription_id;

    private String companyId;

    private int type;

}
