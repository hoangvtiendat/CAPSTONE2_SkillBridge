package com.skillbridge.backend.dto.response;

import com.skillbridge.backend.entity.Job;

import java.util.List;

public class JobFeedResponse {

    private List<Job> jobs;
    private int nextCursor;
    private boolean hasMore;

    public JobFeedResponse(List<Job> jobs, int  nextCursor, boolean hasMore) {
        this.jobs = jobs;
        this.nextCursor = nextCursor;
        this.hasMore = hasMore;
    }

    public List<Job> getJobs() {
        return jobs;
    }

    public int  getNextCursor() {
        return nextCursor;
    }

    public boolean isHasMore() {
        return hasMore;
    }
}
