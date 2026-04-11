package com.skillbridge.backend.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BatchSlotRequest {
    @NotBlank(message = "Job ID không được để trống")
    String jobId;

    @NotNull(message = "Số lượng ứng viên tối đa không được để trống")
    @Min(value = 1, message = "Sức chứa tối thiểu là 1 người")
    Integer defaultCapacity;

    String description;

    @NotEmpty(message = "Phải tạo ít nhất một khung giờ phỏng vấn")
    List<SlotRequest> slots;

    String locationLink;
}