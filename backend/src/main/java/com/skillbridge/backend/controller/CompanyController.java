package com.skillbridge.backend.controller;

import com.skillbridge.backend.dto.CompanyDTO;
import com.skillbridge.backend.dto.request.CompanyIdentificationRequest;
import com.skillbridge.backend.dto.request.RegisterRequest;
import com.skillbridge.backend.dto.request.respondToJoinRequestRequest;
import com.skillbridge.backend.dto.request.CreateJobRequest;
import com.skillbridge.backend.dto.request.DeactivateRequest;
import com.skillbridge.backend.dto.response.ApiResponse;
import com.skillbridge.backend.dto.response.CompanyFeedItemResponse;
import com.skillbridge.backend.dto.response.CompanyFeedResponse;
import com.skillbridge.backend.dto.response.JobFeedResponse;
import com.skillbridge.backend.entity.Job;
import com.skillbridge.backend.entity.User;
import com.skillbridge.backend.enums.CompanyStatus;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.service.CompanyService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/companies")
public class CompanyController {

    @Autowired
    private final CompanyService companyService;

    public CompanyController(CompanyService companyService) {
        this.companyService = companyService;
    }

    @GetMapping("/feed")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCompanyFeed(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(required = false) String cursor,
            @RequestParam(value = "status", required = false) CompanyStatus status,
            @RequestParam(value = "limit", defaultValue = "10") int limit,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String categoryId
    ) {
        CompanyStatus searchStatus = (status != null) ? status : CompanyStatus.ACTIVE;
        Map<String, Object> rs = companyService.getCompanies(page, cursor, searchStatus, limit, keyword, categoryId);
        ApiResponse<Map<String, Object>> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Company Feed",
                rs
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CompanyFeedItemResponse>> getCompanyDetail(@PathVariable String id) {
        CompanyFeedItemResponse result = companyService.getCompanyDetail(id);

        ApiResponse<CompanyFeedItemResponse> response = new ApiResponse<>();
        response.setCode(HttpStatus.OK.value());
        response.setResult(result);
        response.setMessage("Chi tiết công ty");

        return ResponseEntity.ok(response);
    }

    @GetMapping("/taxLook")
    public ResponseEntity<ApiResponse<CompanyDTO>> getInfo(@RequestParam(value = "taxCode", required = false) String mst) {
        System.out.println("mst: " + mst);
        CompanyDTO result = companyService.lookupByTaxCode(mst);

        ApiResponse<CompanyDTO> response = new ApiResponse<>();
        response.setCode(HttpStatus.OK.value());
        response.setResult(result);
        response.setMessage(result != null ? "Tra cứu thành công" : "Không tìm thấy thông tin");

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

    @PostMapping(value = "/identification", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<CompanyFeedItemResponse>> identifyCompany(
            @RequestPart("request") @Valid CompanyIdentificationRequest request, // Dữ liệu text
            @RequestPart("logo") MultipartFile logoFile,                         // File ảnh logo
            @RequestPart("license") MultipartFile licenseFile                      // File GPKD
    ) {
        try {
            CompanyFeedItemResponse rs = companyService.identifyCompany(request, logoFile, licenseFile);
            ApiResponse<CompanyFeedItemResponse> response = new ApiResponse<>(
                    HttpStatus.OK.value(),
                    "Định danh doanh nghiệp và upload hồ sơ thành công",
                    rs
            );
            return ResponseEntity.ok(response);
        } catch (AppException ex) {
            ex.printStackTrace();
            throw ex;
        } catch (Exception ex) {
            ex.printStackTrace();
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
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
                    "Yêu cầu tham gia",
                    rs
            );
            return ResponseEntity.ok(response);
        } catch (AppException ex) {
            System.out.println("[JOIN REQUEST] AppException occurred");
            System.out.println("[JOIN REQUEST] ErrorCode: " + ex.getErrorCode());
            throw ex;
        }
    }

    @PostMapping("/join-request/{requestId}")
    public ResponseEntity<ApiResponse<?>> joinCompanyByRequestId(@Valid @RequestHeader(value = "Authorization") String token, @PathVariable String requestId, @RequestBody respondToJoinRequestRequest request) {
        try {
            System.out.println("token: " + token);
            if (token == null || !token.startsWith("Bearer ")) {
                throw new AppException(ErrorCode.UNAUTHORIZED);
            }
            String jwt = token.substring(7);
            String rs = companyService.respondToJoinRequest(requestId, request.getStatus(), jwt);

            ApiResponse<String> response = new ApiResponse<>(
                    HttpStatus.OK.value(),
                    "Phản hồi yêu cầu",
                    rs
            );
            return ResponseEntity.ok(response);
        } catch (AppException ex) {
            System.out.println("[JOIN REQUEST] AppException occurred");
            System.out.println("[JOIN REQUEST] ErrorCode: " + ex.getErrorCode());
            throw ex;
        }
    }

    @PostMapping("/{companyId}/deactivate")
    public ResponseEntity<ApiResponse<String>> deactivateCompany(
            @PathVariable String companyId,
            @Valid @RequestBody DeactivateRequest request,
            @RequestHeader("Authorization") String token
    ) {
        String jwt = token.substring(7);
        String rs = companyService.deactivateCompany(companyId, request, jwt);
        return ResponseEntity.ok(new ApiResponse<>(HttpStatus.OK.value(), "Success", rs));
    }

    @PostMapping("/{companyId}/reactivate")
    public ResponseEntity<ApiResponse<String>> reactivateCompany(
            @PathVariable String companyId,
            @RequestHeader("Authorization") String token
    ) {
        String jwt = token.substring(7);
        String rs = companyService.reactivateCompany(companyId, jwt);
        return ResponseEntity.ok(new ApiResponse<>(HttpStatus.OK.value(), "Success", rs));
    }

}
