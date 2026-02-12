package com.skillbridge.backend.dto.response;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;

public class CompanyFeedResponse {
    private List<CompanyFeedItemResponse> companies;
    private String nextCursor;
    private boolean hasMore;

    public CompanyFeedResponse(List<CompanyFeedItemResponse> companies, String nextCursor, boolean hasMore) {
        this.companies = companies;
        this.nextCursor = nextCursor;
        this.hasMore = hasMore;
    }

    public List<CompanyFeedItemResponse> getCompanies() {
        return companies;
    }

    public void setCompanies(List<CompanyFeedItemResponse> companies) {
        this.companies = companies;
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