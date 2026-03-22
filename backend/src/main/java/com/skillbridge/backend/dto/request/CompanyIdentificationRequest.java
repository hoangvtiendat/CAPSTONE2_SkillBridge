package com.skillbridge.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.hibernate.validator.constraints.URL;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CompanyIdentificationRequest {

    @NotBlank(message = "INVALID_INPUT")
    @Size(max = 255, message = "INVALID_INPUT")
    String name;

    @NotBlank(message = "COMPANY_EXIST")
    String taxcode;

    @Size(max = 2000, message = "INVALID_INPUT")
    String description;

    @NotBlank(message = "INVALID_INPUT")
    String address;

    @URL(message = "INVALID_INPUT")
    String websiteUrl;
}