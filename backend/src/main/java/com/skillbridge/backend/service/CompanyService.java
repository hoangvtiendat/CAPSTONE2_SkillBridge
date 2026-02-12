package com.skillbridge.backend.service;

import com.skillbridge.backend.dto.response.CompanyFeedItemResponse;
import com.skillbridge.backend.dto.response.CompanyFeedResponse;
import com.skillbridge.backend.enums.CompanyStatus;
import com.skillbridge.backend.repository.CompanyRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CompanyService {
    private final CompanyRepository companyRepository;

    public CompanyService(CompanyRepository companyRepository) {
        this.companyRepository = companyRepository;
    }

    public CompanyFeedResponse getCompanies(String cursor, CompanyStatus status, int limit) {
        Pageable pageable = PageRequest.of(0, limit + 1);
        List<CompanyFeedItemResponse> companies = companyRepository.getCompanyFeed(cursor, status, pageable);
        boolean hasMore = companies.size() > limit;
        String nextCursor = null;

        if (hasMore) {
            companies.remove(limit);
            nextCursor = companies.get(companies.size() - 1).getId();
        }
        return new CompanyFeedResponse(companies, nextCursor, hasMore);
    }
}
