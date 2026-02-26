package com.skillbridge.backend.dto.request;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
@Data
@Getter
@Setter
public class UpdateSubcriptionRequest {
    private BigDecimal price;

    private Integer jobLimit;

    private Integer candidateViewLimit;

    private Boolean hasPriorityDisplay;
}
