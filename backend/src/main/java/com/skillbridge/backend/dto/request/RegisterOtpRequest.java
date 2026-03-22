package com.skillbridge.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RegisterOtpRequest {

    @NotBlank(message = "OTP_INVALID")
    String otp;

    @NotBlank(message = "INVALID_INPUT")
    @Email(message = "EMAIL_INVALID")
    String email;

    @NotBlank(message = "PASSWORD_TOO_WEAK")
    String password;

    @NotBlank(message = "INVALID_INPUT")
    String name;

    @NotBlank(message = "INVALID_INPUT")
    @Pattern(regexp = "^(0|\\+84)[0-9]{9}$", message = "PHONE_INVALID")
    String phoneNumber;

    String address;
}