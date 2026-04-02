package com.skillbridge.backend.controller;

import com.skillbridge.backend.config.CustomUserDetails;
import com.skillbridge.backend.dto.request.JobApplicationRequest;
import com.skillbridge.backend.dto.response.*;
import com.skillbridge.backend.dto.request.CreateJobRequest;
import com.skillbridge.backend.entity.User;
import com.skillbridge.backend.enums.JobStatus;
import com.skillbridge.backend.enums.ModerationStatus;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.entity.Job;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.service.JobService;
import com.skillbridge.backend.utils.PageableUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;
import java.util.List;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/jobs")
public class JobController {
    JobService jobService;

    @GetMapping("/feed")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getFeed(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) String categoryId,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Double salary
    ) {
        Map<String, Object> rs = jobService.getJobFeed(page, limit, categoryId, location, salary);
        ApiResponse<Map<String, Object>> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Job Feed",
                rs
        );
        return ResponseEntity.ok(response);
    }

//    @GetMapping("/feed")
//    public ResponseEntity<ApiResponse<PageResponse<JobFeedItemResponse>>> getFeed(
//            @RequestParam(defaultValue = "0") int page,
//            @RequestParam(defaultValue = "10") int size,
//            @RequestParam(defaultValue = "createdAt") String sortBy,
//            @RequestParam(defaultValue = "desc") String direction,
//            @RequestParam(required = false) String categoryId,
//            @RequestParam(required = false) String location,
//            @RequestParam(required = false) Double salary
//    ) {
//        Pageable pageable = PageableUtils.createPageable(page, size, sortBy, direction);
//        PageResponse<JobFeedItemResponse> rs = jobService.getJobFeed(categoryId, location, salary, pageable);
//        return ResponseEntity.ok(ApiResponse.<PageResponse<JobFeedItemResponse>>builder()
//                .code(HttpStatus.OK.value())
//                .message("Lấy danh sách tin tuyển dụng thành công")
//                .result(rs)
//                .build());
//    }

    @GetMapping("/company/{companyId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getJobsByCompany(
            @PathVariable String companyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) List<String> categoryIds
    ) {
        Map<String, Object> rs = jobService.getJobsByCompany(companyId, page, limit, categoryIds);
        ApiResponse<Map<String, Object>> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Danh sách việc làm của công ty",
                rs
        );
        return ResponseEntity.ok(response);
    }

//    @GetMapping("/company/{companyId}")
//public ResponseEntity<ApiResponse<PageResponse<JobFeedItemResponse>>> getJobsByCompany(
//        @PathVariable String companyId,
//        @RequestParam(defaultValue = "0") int page,
//        @RequestParam(defaultValue = "10") int size, // Đổi limit thành size cho đồng bộ
//        @RequestParam(defaultValue = "createdAt") String sortBy,
//        @RequestParam(defaultValue = "desc") String direction,
//        @RequestParam(required = false) List<String> categoryIds
//) {
//    // 1. Tạo Pageable ngay tại Controller
//    Pageable pageable = PageableUtils.createPageable(page, size, sortBy, direction);
//
//    // 2. Gọi Service truyền vào pageable
//    PageResponse<JobFeedItemResponse> rs = jobService.getJobsByCompany(companyId, categoryIds, pageable);
//
//    return ResponseEntity.ok(ApiResponse.<PageResponse<JobFeedItemResponse>>builder()
//            .code(HttpStatus.OK.value())
//            .message("Danh sách việc làm của công ty")
//            .result(rs)
//            .build());
//}

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<JobDetailResponse>> getJobDetailByCandidate(
            @PathVariable String id,
            HttpServletRequest request
    ) {
        JobDetailResponse result = jobService.getJobDetail(id, request);
        ApiResponse<JobDetailResponse> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Xem chi tiết JD thành công",
                result
        );
        return ResponseEntity.ok(response);
    }

//    @GetMapping("/feedAdmin")
//    public ResponseEntity<ApiResponse<PageResponse<AdminJobFeedItemResponse>>> getAllJobsForAdmin(
//            @RequestParam(defaultValue = "0") int page,
//            @RequestParam(defaultValue = "10") int size,
//            @RequestParam(defaultValue = "createdAt") String sortBy,
//            @RequestParam(defaultValue = "desc") String direction,
//            @RequestParam(required = false) String status,
//            @RequestParam(required = false) String modStatus
//    ) {
//        Pageable pageable = PageableUtils.createPageable(page, size, sortBy, direction);
//        PageResponse<AdminJobFeedItemResponse> result = jobService.adminGetJob(status, modStatus,pageable);
//
//        return ResponseEntity.ok(ApiResponse.<PageResponse<AdminJobFeedItemResponse>>builder()
//                .code(HttpStatus.OK.value())
//                .message("Lấy danh sách quản trị tin tuyển dụng thành công")
//                .result(result)
//                .build());
//    }

    @GetMapping("/feedAdmin")
    public ResponseEntity<ApiResponse<AdminJobFeedResponse>> getAllJobsForAdmin(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String modStatus
    ) {
        AdminJobFeedResponse result = jobService.adminGetJob(page, limit, status, modStatus);
        ApiResponse<AdminJobFeedResponse> response = new ApiResponse<>(HttpStatus.OK.value(), "Job Feed", result);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/feedAdminPending")
    public ResponseEntity<ApiResponse<AdminJobFeedResponse>> getPendingJobsForAdmin(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) String modStatus
    ){
        AdminJobFeedResponse result = jobService.adminGetJobPending(page,limit,modStatus);
        ApiResponse<AdminJobFeedResponse> response = new ApiResponse<>(HttpStatus.OK.value(),"Pending Job Feed",result);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/feedAdmin/{id}")
    public ResponseEntity<ApiResponse<JobDetailResponse>> getJobDetail(
            @PathVariable String id,
            HttpServletRequest request) {
        JobDetailResponse result = jobService.getJobDetail(id, request);
        ApiResponse<JobDetailResponse> response = new ApiResponse<>(HttpStatus.OK.value(), "Xem chi tiet jd", result);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/feedAdmin/{jobId}")
    public ResponseEntity<ApiResponse<Void>> deleteJob(
            @PathVariable String jobId
    ) {;
        jobService.deleteJob(jobId);
        ApiResponse<Void> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Đã xóa bài đăng tuyển dụng thành công",
                null
        );

        return ResponseEntity.ok(response);
    }

    @PatchMapping("/feedAdmin/{jobId}/moderation")
    public ResponseEntity<ApiResponse<Void>> changeModerationStatus(
            @PathVariable String jobId,
            @RequestParam("status") String modStatus
    ) {
        jobService.changeModerationStatus(jobId, modStatus);
        ApiResponse<Void> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Đã cập nhật trạng thái kiểm duyệt thành " + modStatus,
                null
        );
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/feedAdmin/{jobId}/status")
    public ResponseEntity<ApiResponse<Void>> changeStatus(
            @PathVariable String jobId,
            @RequestParam("status") String status
    ) {
        jobService.changeStatus(jobId, status);
        ApiResponse<Void> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Đã cập nhật trạng thái job thành " + status,
                null
        );

        return ResponseEntity.ok(response);
    }

    @PatchMapping("/feedAdmin/{jobId}/response")
    public ResponseEntity<ApiResponse<Void>> responseJobPending(
            @RequestParam String status,
            @PathVariable String jobId
    ) {
        jobService.responseJobPending(jobId,status);
        ApiResponse<Void> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Đã chấp nhận bài đăng thành công",
                null
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/postJD")
    public ResponseEntity<Job> createJob(@Valid @RequestBody CreateJobRequest request) {
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
                new ApiResponse<>(200, "Update bài đăng thành công ", updatedJob)
        );
    }

    @DeleteMapping("/my-company/delete/{id}")
    public ResponseEntity<ApiResponse<Job>> deleteJD(@PathVariable String id) {
        Job updatedJob = jobService.deleteJD(id);
        return ResponseEntity.ok(
                new ApiResponse<>(200, "Xóa bài đăng thành công", updatedJob)
        );
    }
///  chưa làm nha
    @PostMapping("/repost/{id}")
    public ResponseEntity<ApiResponse<Job>> repostJD(@PathVariable String id) {
        Job rePost = jobService.repost(id);
        return ResponseEntity.ok(
                new ApiResponse<>(200, "Đăng lại bài đăng thành ", rePost)
        );
    }

    @PostMapping(value = "/{jobId}/apply", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<JobApplicationRequest>> applyJob(
            @PathVariable String jobId,
            @RequestPart("request") @Valid JobApplicationRequest request,
            @RequestPart("cv") MultipartFile cv
    ) {
        try {
            JobApplicationRequest rs = jobService.applyJob(request, jobId, cv);

            ApiResponse<JobApplicationRequest> response = new ApiResponse<>(
                    HttpStatus.OK.value(), "Nộp hồ sơ ứng tuyển thành công", rs
            );
            return ResponseEntity.ok(response);
        } catch (AppException ex) {
            ex.printStackTrace();
            throw ex;
        } catch (Exception ex) {
            ex.printStackTrace();
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }
}
