package com.skillbridge.backend.dto.response;

import com.skillbridge.backend.entity.Job;

import java.util.List;

public class JobFeedResponse {

    private List<JobFeedItemResponse> JobFeedItemResponse;
    private String nextCursor;
    private boolean hasMore;

    public JobFeedResponse(List<JobFeedItemResponse> JobFeedItemResponse, String  nextCursor, boolean hasMore) {
        this.JobFeedItemResponse = JobFeedItemResponse;
        this.nextCursor = nextCursor;
        this.hasMore = hasMore;
    }

    public List<JobFeedItemResponse> getJobs() {
        return JobFeedItemResponse;
    }

    public void setJobs(List<JobFeedItemResponse> jobs) {
        this.JobFeedItemResponse = jobs;
    }

    public String getNextCursor() {
        return nextCursor;
    }

    public void setNextCursor(String nextCursor) {
        this.nextCursor = nextCursor;
    }

    public boolean isHasMore() {
        return hasMore;
    }

    public void setHasMore(boolean hasMore) {
        this.hasMore = hasMore;
    }
}
