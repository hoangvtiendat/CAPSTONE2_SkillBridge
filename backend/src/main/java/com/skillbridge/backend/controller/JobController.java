package com.skillbridge.backend.controller;

import com.skillbridge.backend.dto.response.ApiResponse;
import com.skillbridge.backend.dto.response.JobFeedResponse;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.service.JobService;
import org.aspectj.apache.bcel.util.Repository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

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
            @RequestParam(defaultValue = "0") int cursor,
            @RequestParam(defaultValue = "10") int limit
    ) {
        try{
            JobFeedResponse rs = jobService.getJobFeed(cursor,limit);
            ApiResponse<JobFeedResponse> response = new ApiResponse<>(
                    HttpStatus.OK.value(), "Job Feed", rs
            );
            return ResponseEntity.ok(response);
        } catch (AppException ex) {
            System.out.println("[JobFeed] AppException occurred");
            System.out.println("[JobFeed] ErrorCode: " + ex.getErrorCode());
            throw ex;
        }
    }
}
