package com.skillbridge.backend.controller;

import com.skillbridge.backend.config.CustomUserDetails;
import com.skillbridge.backend.dto.response.AdminJobFeedResponse;
import com.skillbridge.backend.dto.response.ApiResponse;
import com.skillbridge.backend.dto.response.JobDetailResponse;
import com.skillbridge.backend.dto.response.JobFeedResponse;
import com.skillbridge.backend.enums.JobStatus;
import com.skillbridge.backend.enums.ModerationStatus;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.service.JobService;
import org.aspectj.apache.bcel.util.Repository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/jobs")
public class JobController {

    private final JobService jobService;

    public JobController(JobService jobService) {
        this.jobService = jobService;
    }

    @GetMapping("/feed")
    public ResponseEntity<ApiResponse<JobFeedResponse>> getFeed(
            @RequestParam(required = false) String cursor,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) String categoryId,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Double salary
    ) {
        JobFeedResponse rs = jobService.getJobFeed(cursor, limit, categoryId, location, salary);
        ApiResponse<JobFeedResponse> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Job Feed",
                rs
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<JobDetailResponse>> getJobDetailByCandidate(@PathVariable String id) {

        JobDetailResponse result = jobService.getJobDetail(id);
        ApiResponse<JobDetailResponse> response = new ApiResponse<>(HttpStatus.OK.value(),"Xem chi tiet jd",result);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/feedAdmin")
    public ResponseEntity<ApiResponse<AdminJobFeedResponse>> getAllJobsForAdmin(
            @RequestParam(required = false) String cursor,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String modStatus) {

        AdminJobFeedResponse result = jobService.adminGetJob(cursor, limit, status, modStatus);
        ApiResponse<AdminJobFeedResponse> response = new ApiResponse<>(HttpStatus.OK.value(), "Job Feed", result);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/feedAdmin/{id}")
    public ResponseEntity<ApiResponse<JobDetailResponse>> getJobDetail(@PathVariable String id) {

        JobDetailResponse result = jobService.getJobDetail(id);
        ApiResponse<JobDetailResponse> response = new ApiResponse<>(HttpStatus.OK.value(),"Xem chi tiet jd",result);

        return ResponseEntity.ok(response);
    }
    @DeleteMapping("/feedAdmin/{jobId}")
    public ResponseEntity<ApiResponse<Void>> deleteJob(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable String jobId
    ) {
        System.out.println("Admin yêu cầu xóa Job ID: " + jobId);
        jobService.deleteJob(user,jobId);
        ApiResponse<Void> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Đã xóa bài đăng tuyển dụng thành công",
                null
        );

        return ResponseEntity.ok(response);
    }

    @PatchMapping("/feedAdmin/{jobId}/moderation")
    public ResponseEntity<ApiResponse<Void>> changeModerationStatus(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable String jobId,
            @RequestParam String status
    ) {
        jobService.changeModerationStatus(user, jobId, status);
        ApiResponse<Void> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Đã cập nhật trạng thái kiểm duyệt thành " + status,
                null
        );

        return ResponseEntity.ok(response);
    }

    @PatchMapping("/feedAdmin/{jobId}/status")
    public ResponseEntity<ApiResponse<Void>> changeStatus(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable String jobId,
            @RequestParam String status
    ) {
        jobService.changeStatus(user, jobId, status);
        ApiResponse<Void> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Đã cập nhật trạng thái job thành " + status,
                null
        );

        return ResponseEntity.ok(response);
    }
}
