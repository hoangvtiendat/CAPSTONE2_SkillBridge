package com.skillbridge.backend.dto.request;

import com.skillbridge.backend.enums.ApplicationStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RespondToApplicationRequest {

    @NotBlank(message = "INVALID_APPLICATION_STATUS")
    String status;
    String note;
}