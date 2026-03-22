package com.skillbridge.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ResetPasswordRequest {

    @NotBlank(message = "OTP_INVALID")
    String otp;

    @NotBlank(message = "PASSWORD_TOO_WEAK")
    @Size(min = 8, message = "PASSWORD_TOO_WEAK")
    String password;

    @NotBlank(message = "INVALID_INPUT")
    @Email(message = "EMAIL_INVALID")
    String email;
}