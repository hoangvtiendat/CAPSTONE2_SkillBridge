package com.skillbridge.backend.dto.response;

import java.util.List;

public class AdminJobFeedResponse {
    private List<AdminJobFeedItemResponse> adminJobFeedItemResponse;
    private String nextCursor;
    private boolean hasMore;

    public AdminJobFeedResponse(List<AdminJobFeedItemResponse> adminJobFeedItemResponse, String nextCursor, boolean hasMore) {
        this.adminJobFeedItemResponse = adminJobFeedItemResponse;
        this.nextCursor = nextCursor;
        this.hasMore = hasMore;
    }

    public List<AdminJobFeedItemResponse> getAdminJobFeedItemResponse() {
        return adminJobFeedItemResponse;
    }

    public void setAdminJobFeedItemResponse(List<AdminJobFeedItemResponse> adminJobFeedItemResponse) {
        this.adminJobFeedItemResponse = adminJobFeedItemResponse;
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
