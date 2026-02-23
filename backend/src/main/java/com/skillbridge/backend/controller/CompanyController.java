package com.skillbridge.backend.controller;

import com.skillbridge.backend.dto.request.CompanyIdentificationRequest;
import com.skillbridge.backend.dto.request.RegisterRequest;
import com.skillbridge.backend.dto.response.ApiResponse;
import com.skillbridge.backend.dto.response.CompanyFeedItemResponse;
import com.skillbridge.backend.dto.response.CompanyFeedResponse;
import com.skillbridge.backend.dto.response.JobFeedResponse;
import com.skillbridge.backend.entity.User;
import com.skillbridge.backend.enums.CompanyStatus;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.service.CompanyService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/companies")
public class CompanyController {
    private final CompanyService companyService;

    public CompanyController(CompanyService companyService) {
        this.companyService = companyService;
    }

    @GetMapping("/feed")
    public ResponseEntity<ApiResponse<CompanyFeedResponse>> getCompanyFeed(
            @RequestParam(value = "cursor", required = false) String cursor,
            @RequestParam(value = "status", required = false) CompanyStatus status,
            @RequestParam(value = "limit", defaultValue = "10") int limit
    ) {
        CompanyStatus searchStatus = (status != null) ? status : CompanyStatus.VERIFIED;
        CompanyFeedResponse rs = companyService.getCompanies(cursor, searchStatus, limit);
        ApiResponse<CompanyFeedResponse> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Company Feed",
                rs
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/taxcode")
    public ResponseEntity<ApiResponse<CompanyFeedItemResponse>> getCompanyByTax(
            @RequestParam String taxCode
    ) {
        try {
            CompanyFeedItemResponse rs = companyService.getCompanyByTax(taxCode);
            ApiResponse<CompanyFeedItemResponse> response = new ApiResponse<>(
                    HttpStatus.OK.value(),
                    "Thông tin công ty theo mã số thuế",
                    rs
            );
            return ResponseEntity.ok(response);
        } catch (AppException ex) {
            System.out.println("[GET COMPANY BY TAXCODE ] AppException occurred");
            System.out.println("[GET COMPANY BY TAXCODE] ErrorCode: " + ex.getErrorCode());
            throw ex;
        }
    }

    @PostMapping("/identification")
    public ResponseEntity<ApiResponse<CompanyFeedItemResponse>> identifyCompany(@Valid @RequestBody CompanyIdentificationRequest request) {
        try {
            CompanyFeedItemResponse rs = companyService.identifyCompany(request);
            ApiResponse<CompanyFeedItemResponse> response = new ApiResponse<>(
                    HttpStatus.OK.value(),
                    "Định danh doanh nghiệp",
                    rs
            );
            return ResponseEntity.ok(response);
        } catch (AppException ex) {
            System.out.println("[COMPANY IDENTITY] AppException occurred");
            System.out.println("[COMPANY IDENTITY] ErrorCode: " + ex.getErrorCode());
            throw ex;
        }
    }

    @PostMapping("/{companyId}/join-request")
    public ResponseEntity<ApiResponse<String>> joinCompany(@Valid @RequestHeader(value = "Authorization") String token, @PathVariable String companyId) {
        try {
            System.out.println("token: " + token);
            if (token == null || !token.startsWith("Bearer ")) {
                throw new AppException(ErrorCode.UNAUTHORIZED);
            }
            String jwt = token.substring(7);
            String rs = companyService.joinCompany(companyId, jwt);

            ApiResponse<String> response = new ApiResponse<>(
                    HttpStatus.OK.value(),
                    "Định danh doanh nghiệp",
                    rs
            );
            return ResponseEntity.ok(response);
        } catch (AppException ex) {
            System.out.println("[JOIN REQUEST] AppException occurred");
            System.out.println("[JOIN REQUEST] ErrorCode: " + ex.getErrorCode());
            throw ex;
        }
    }

}
