package com.skillbridge.backend.service;

import com.skillbridge.backend.dto.response.JobFeedResponse;
import com.skillbridge.backend.entity.Job;
import com.skillbridge.backend.entity.JobStatus;
import com.skillbridge.backend.repository.JobRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
public class JobService {

    private final JobRepository jobRepository;

    public JobService(JobRepository jobRepository) {
        this.jobRepository = jobRepository;
    }

//    @Async
//    public CompletableFuture<JobFeedResponse> getJobFeed(int cursor, int limit) {
//
//        Pageable pageable = PageRequest.of(0, limit + 1);

//        List<Job> jobs = jobRepository.findJobFeed(
//                JobStatus.OPEN,
//                cursor,
//                pageable
//        );

//        boolean hasMore = jobs.size() > limit;
//
//        List<Job> result = hasMore
//                ? jobs.subList(0, limit)
//                : jobs;
//
//        String nextCursor = hasMore
//                ? result.get(result.size() - 1).getId()
//                : null;
//
//        return CompletableFuture.completedFuture(
//                new JobFeedResponse(result, nextCursor, hasMore)
//        );
//}
}
