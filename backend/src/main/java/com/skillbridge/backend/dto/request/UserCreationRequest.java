package com.skillbridge.backend.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserCreationRequest {
    String password;
    String email;
    String role = "CANDIDATE";
    String status = "ACTIVE";
    String is2faEnabled;
}
