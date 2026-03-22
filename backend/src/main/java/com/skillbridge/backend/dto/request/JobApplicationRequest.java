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
public class JobApplicationRequest {

    @NotBlank(message = "INVALID_INPUT")
    String name;

    @Email(message = "EMAIL_INVALID")
    @NotBlank(message = "INVALID_INPUT")
    String email;

    @NotBlank(message = "INVALID_INPUT")
    @Pattern(regexp = "^(0|\\+84)[0-9]{9}$", message = "PHONE_INVALID")
    String numberPhone;

    String recommendationLetter;
}