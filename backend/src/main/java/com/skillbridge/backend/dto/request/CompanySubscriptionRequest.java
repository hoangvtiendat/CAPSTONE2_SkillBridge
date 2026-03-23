package com.skillbridge.backend.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CompanySubscriptionRequest {

    @NotNull(message = "INVALID_INPUT")
    @Min(value = 1, message = "INVALID_CUSTOM_LIMITS")
    Integer jobLimit;


    @NotNull(message = "INVALID_INPUT")
    @Min(value = 1, message = "INVALID_CUSTOM_LIMITS")
    Integer candidateViewLimit;

    @Builder.Default
    Boolean hasPriorityDisplay = false;
}