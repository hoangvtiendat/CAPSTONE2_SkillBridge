package com.skillbridge.backend.dto.response;

import java.util.List;

public class AdminJobFeedResponse {
    private List<AdminJobFeedItemResponse> adminJobFeedItemResponse;
    private int totalPages;
    private long totalElements;
    private int currentPage;

    public AdminJobFeedResponse(List<AdminJobFeedItemResponse> adminJobFeedItemResponse, int totalPages, long totalElements, int currentPage) {
        this.adminJobFeedItemResponse = adminJobFeedItemResponse;
        this.totalPages = totalPages;
        this.totalElements = totalElements;
        this.currentPage = currentPage;
    }

    public List<AdminJobFeedItemResponse> getAdminJobFeedItemResponse() {
        return adminJobFeedItemResponse;
    }

    public void setAdminJobFeedItemResponse(List<AdminJobFeedItemResponse> adminJobFeedItemResponse) {
        this.adminJobFeedItemResponse = adminJobFeedItemResponse;
    }

    public int getTotalPages() {
        return totalPages;
    }

    public void setTotalPages(int totalPages) {
        this.totalPages = totalPages;
    }

    public long getTotalElements() {
        return totalElements;
    }

    public void setTotalElements(long totalElements) {
        this.totalElements = totalElements;
    }

    public int getCurrentPage() {
        return currentPage;
    }

    public void setCurrentPage(int currentPage) {
        this.currentPage = currentPage;
    }
}
