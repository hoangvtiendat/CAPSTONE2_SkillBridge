package com.skillbridge.backend.controller;

import com.skillbridge.backend.config.CustomUserDetails;
import com.skillbridge.backend.dto.response.AdminJobFeedResponse;
import com.skillbridge.backend.dto.request.CreateJobRequest;
import com.skillbridge.backend.dto.response.ApiResponse;
import com.skillbridge.backend.dto.response.JobDetailResponse;
import com.skillbridge.backend.dto.response.JobFeedResponse;
import com.skillbridge.backend.enums.JobStatus;
import com.skillbridge.backend.enums.ModerationStatus;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.dto.response.JobResponse;
import com.skillbridge.backend.entity.Job;
import com.skillbridge.backend.service.JobService;
import jakarta.validation.Valid;
import org.springframework.data.repository.query.Param;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @PostMapping("/postJD")
    public ResponseEntity<Job> createJob(@Valid @RequestBody CreateJobRequest request) {
        // Tạm thời vẫn giữ nguyên trả về Job, nếu sau này muốn làm sạch thì map qua DTO tương tự các hàm dưới
        Job createdJob = jobService.createJD(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdJob);
    }

    @GetMapping("/my-company")
    public ResponseEntity<ApiResponse<List<JobResponse>>> getMyCompany() {
        List<JobResponse> jobs = jobService.find_JD_of_Company();
        return ResponseEntity.ok(
                new ApiResponse<>(200, "Lấy danh sách JD thành công", jobs)
        );
    }

    @GetMapping("/my-company/{id}")
    public ResponseEntity<ApiResponse<JobResponse>> getJob(@PathVariable String id) {
        JobResponse in4_job = jobService.getIn4_of_JD_of_Company(id);
        return ResponseEntity.ok(
                new ApiResponse<>(200, "Lấy thông tin thành công", in4_job)
        );
    }
    @PutMapping("/my-company/Update/{id}")
    public ResponseEntity<ApiResponse<Job>> updateJD(@PathVariable String id, @RequestBody CreateJobRequest request) {
        Job updatedJob = jobService.updateJD(id, request);
        return ResponseEntity.ok(
                new ApiResponse<>(200,"Update bài đăng thành công ", updatedJob)
        );
    }
    @DeleteMapping("/my-company/delete/{id}")
    public ResponseEntity<ApiResponse<Job>> deleteJD(@PathVariable String id) {
        Job updatedJob = jobService.deleteJD(id);
        return ResponseEntity.ok(
                new ApiResponse<>(200,"Xóa bài đăng thành công", updatedJob)
        );
    }
    @PostMapping("/repost/{id}")
    public ResponseEntity<ApiResponse<Job>> repostJD(@PathVariable String id) {
        Job rePost = jobService.repost(id);
        return ResponseEntity.ok(
                new ApiResponse<>(200,"Đăng lại bài đăng thành ", rePost)
        );
    }

}