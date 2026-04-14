package com.skillbridge.backend.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SlotRequest {

    @NotNull(message = "Thời gian bắt đầu không được để trống")
    LocalDateTime startTime;

    @NotNull(message = "Thời gian kết thúc không được để trống")
    LocalDateTime endTime;

    @NotNull(message = "Số lượng ứng viên tối đa không được để trống")
    @Min(value = 1, message = "Sức chứa tối thiểu của mỗi lượt là 1 người")
    Integer capacity;

    String locationLink;

    String description;
}