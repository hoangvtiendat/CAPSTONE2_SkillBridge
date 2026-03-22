package com.skillbridge.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.skillbridge.backend.enums.CompanyStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CompanyResponse {

    String id;
    String name;
    String taxId;
    String gpkdUrl;
    String imageUrl;
    CompanyStatus status;
    String description;
    String address;
    String websiteUrl;
    LocalDateTime createdAt;

}