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
    private Integer postingDuration; // Adding field if it was missing or implied

    @NotNull(message = "Số lượng lượt xem ứng viên không được để trống")
    @Min(value = 1, message = "Số lượng lượt xem ứng viên phải lớn hơn 0")
    private Integer candidateViewLimit;

    private Boolean hasPriorityDisplay;

    // Manual Getter/Setters
    public Integer getJobLimit() { return jobLimit; }
    public void setJobLimit(Integer jobLimit) { this.jobLimit = jobLimit; }

    public Integer getPostingDuration() { return postingDuration; }
    public void setPostingDuration(Integer postingDuration) { this.postingDuration = postingDuration; }

    public Integer getCandidateViewLimit() { return candidateViewLimit; }
    public void setCandidateViewLimit(Integer candidateViewLimit) { this.candidateViewLimit = candidateViewLimit; }

    public Boolean getHasPriorityDisplay() { return hasPriorityDisplay; }
    public void setHasPriorityDisplay(Boolean hasPriorityDisplay) { this.hasPriorityDisplay = hasPriorityDisplay; }
}