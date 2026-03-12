package com.skillbridge.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;

@Data
@Builder
@Getter
public class PaymentRequest {
    private long amount;

}
