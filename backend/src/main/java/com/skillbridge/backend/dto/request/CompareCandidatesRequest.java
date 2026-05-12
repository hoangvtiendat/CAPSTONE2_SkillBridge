package com.skillbridge.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CompareCandidatesRequest {
    @NotBlank(message = "Thiếu đơn ứng tuyển thứ nhất")
    String applicationIdA;

    @NotBlank(message = "Thiếu đơn ứng tuyển thứ hai")
    String applicationIdB;
}
