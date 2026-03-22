package com.skillbridge.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class DeactivateRequest {

    @NotBlank(message = "INVALID_CONFIRMATION_CODE")
    String confirmationCode;
}