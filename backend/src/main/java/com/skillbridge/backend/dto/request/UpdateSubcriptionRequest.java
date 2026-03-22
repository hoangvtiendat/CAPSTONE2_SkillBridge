package com.skillbridge.backend.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateSubcriptionRequest {
    BigDecimal price;

    Integer jobLimit;

    Integer candidateViewLimit;

    Boolean hasPriorityDisplay;
}
