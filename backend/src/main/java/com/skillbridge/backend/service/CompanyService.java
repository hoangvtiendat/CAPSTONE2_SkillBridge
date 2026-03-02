package com.skillbridge.backend.service;

import com.skillbridge.backend.dto.response.CompanyFeedItemResponse;
import com.skillbridge.backend.dto.response.CompanyFeedResponse;
import com.skillbridge.backend.enums.CompanyStatus;
import com.skillbridge.backend.repository.CompanyRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class CompanyService {
    private final CompanyRepository companyRepository;

    public CompanyService(CompanyRepository companyRepository) {
        this.companyRepository = companyRepository;
    }

    public Map<String, Object> getCompanies(int page, CompanyStatus status, int limit) {
        Pageable pageable = PageRequest.of(page, limit);
        Page<CompanyFeedItemResponse> companyPage = companyRepository.getCompanyFeed(status, pageable);

        return Map.of(
            "companies", companyPage.getContent(),
            "totalPages", companyPage.getTotalPages(),
            "totalElements", companyPage.getTotalElements(),
            "currentPage", companyPage.getNumber()
        );
    }
}
