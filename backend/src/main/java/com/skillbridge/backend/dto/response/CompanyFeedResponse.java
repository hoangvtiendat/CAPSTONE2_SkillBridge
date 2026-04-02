package com.skillbridge.backend.dto.response;

import java.util.List;

public class CompanyFeedResponse {
    private List<CompanyFeedItemResponse> companies;
    private int totalPages;
    private long totalElements;
    private int currentPage;

    public CompanyFeedResponse(List<CompanyFeedItemResponse> companies, int totalPages, long totalElements, int currentPage) {
        this.companies = companies;
        this.totalPages = totalPages;
        this.totalElements = totalElements;
        this.currentPage = currentPage;
    }

    public List<CompanyFeedItemResponse> getCompanies() {
        return companies;
    }

    public void setCompanies(List<CompanyFeedItemResponse> companies) {
        this.companies = companies;
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