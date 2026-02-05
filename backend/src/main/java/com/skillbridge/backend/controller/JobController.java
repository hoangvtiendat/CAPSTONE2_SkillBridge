package com.skillbridge.backend.controller;

import com.skillbridge.backend.dto.response.JobFeedResponse;
import com.skillbridge.backend.service.JobService;
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

//    @GetMapping("/feed")
//    public CompletableFuture<JobFeedResponse> getFeed(
//            @RequestParam(required = false) String cursor,
//            @RequestParam(defaultValue = "10") int limit
//    ) {
//        return jobService.getJobFeed(cursor, limit);
//    }
}
