package com.skillbridge.backend.controller;

import com.skillbridge.backend.dto.CompanyDTO;
import com.skillbridge.backend.dto.response.ApiResponse;
import com.skillbridge.backend.dto.response.CompanyFeedResponse;
import com.skillbridge.backend.dto.response.JobFeedResponse;
import com.skillbridge.backend.enums.CompanyStatus;
import com.skillbridge.backend.service.CompanyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/companies")
public class CompanyController {

    @Autowired
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

    @GetMapping("/{mst}")
    public ResponseEntity<ApiResponse<CompanyDTO>> getInfo(@PathVariable String mst) {
        CompanyDTO result = companyService.lookupByTaxCode(mst);

        ApiResponse<CompanyDTO> response = new ApiResponse<>();
        response.setCode(HttpStatus.OK.value());
        response.setResult(result);
        response.setMessage(result != null ? "Tra cứu thành công" : "Không tìm thấy thông tin");

        return ResponseEntity.ok(response);
    }
}
