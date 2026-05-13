package com.skillbridge.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserResponse {

    String id;
    String name;
    String avatar;
    String email;
    String phoneNumber;
    String address;
    String role;
    String status;
    String is2faEnabled;
    String provider;
    LocalDateTime createdAt;

    // Thông tin công ty đi kèm (nếu có)
    String companyId;
    String companyName;
    String companyTaxId;
    String companyStatus;
    String companyRole;

}