package com.skillbridge.backend.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanySubscriptionRequest {

    @NotNull(message = "Số lượng tin tuyển dụng không được để trống")
    @Min(value = 1, message = "Số lượng tin tuyển dụng phải lớn hơn 0")
    private Integer jobLimit;

    @NotNull(message = "Số ngày đăng không được để trống")
    @Min(value = 1,  message = "Số lượng ngày đăng tuyển dụng phải lớn hơn 0")

    @NotNull(message = "Số lượng lượt xem ứng viên không được để trống")
    @Min(value = 1, message = "Số lượng lượt xem ứng viên phải lớn hơn 0")
    private Integer candidateViewLimit;

    private Boolean hasPriorityDisplay;
}