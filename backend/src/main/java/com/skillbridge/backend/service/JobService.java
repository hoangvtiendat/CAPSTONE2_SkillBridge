package com.skillbridge.backend.service;

import com.skillbridge.backend.dto.response.JobFeedResponse;
import com.skillbridge.backend.entity.Job;
import com.skillbridge.backend.enums.JobStatus;
import com.skillbridge.backend.repository.JobRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.awt.print.Pageable;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
public class JobService {

    private final JobRepository jobRepository;

    public JobService(JobRepository jobRepository) {
        this.jobRepository = jobRepository;
    }

//    @Async
    public JobFeedResponse getJobFeed(int cursor, int limit) {

        List<Job> jobs = jobRepository.findAll();

        boolean hasMore = jobs.size() > limit;

        List<Job> result = hasMore
                ? jobs.subList(0, limit)
                : jobs;

        int nextCursor = 5;
//        int nextCursor = hasMore
//                ? result.get(result.size() - 1).getId()
//                : null;

        return new JobFeedResponse(result, nextCursor, hasMore);
    }
}
