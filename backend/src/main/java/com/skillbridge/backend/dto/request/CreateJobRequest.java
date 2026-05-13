package com.skillbridge.backend.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateJobRequest {

    @NotBlank(message = "INVALID_INPUT")
    String position;

    @NotEmpty(message = "INVALID_INPUT")
    Map<String, Object> title;

    @NotBlank(message = "INVALID_INPUT")
    String description;

    @NotBlank(message = "CATEGORY_NOT_FOUND")
    String categoryId;

    @Min(value = 0, message = "INVALID_INPUT")
    BigDecimal salaryMin;

    @Min(value = 0, message = "INVALID_INPUT")
    BigDecimal salaryMax;

    @NotBlank(message = "INVALID_INPUT")
    String location;

    @NotEmpty(message = "SKILL_NOT_FOUND")
    List<JobSkillRequest> skills;
    @NotNull(message = "Ngày bắt đầu không được để trống")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "dd/MM/yyyy HH:mm:ss")
    private LocalDateTime startDate;

    @NotNull(message = "Ngày kết thúc không được để trống")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "dd/MM/yyyy HH:mm:ss")
    private LocalDateTime endDate;
}