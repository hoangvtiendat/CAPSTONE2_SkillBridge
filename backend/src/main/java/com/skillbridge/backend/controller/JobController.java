package com.skillbridge.backend.controller;

import com.skillbridge.backend.dto.response.ApiResponse;
import com.skillbridge.backend.dto.response.JobFeedResponse;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.service.JobService;
import org.aspectj.apache.bcel.util.Repository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
}
