package com.skillbridge.backend.controller;

import com.skillbridge.backend.config.CustomUserDetails;
import com.skillbridge.backend.dto.CompanyDTO;
import com.skillbridge.backend.dto.request.CompanyIdentificationRequest;
import com.skillbridge.backend.dto.request.RespondToJoinRequest;
import com.skillbridge.backend.dto.request.DeactivateRequest;
import com.skillbridge.backend.dto.response.ApiResponse;
import com.skillbridge.backend.dto.response.CompanyFeedItemResponse;
import com.skillbridge.backend.dto.response.CompanyFeedResponse;
import com.skillbridge.backend.dto.response.PageResponse;
import com.skillbridge.backend.enums.CompanyStatus;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.service.CompanyService;
import com.skillbridge.backend.utils.PageableUtils;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/companies")
public class CompanyController {
    CompanyService companyService;

    @GetMapping("/feed")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCompanyFeed(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "status", required = false) CompanyStatus status,
            @RequestParam(value = "limit", defaultValue = "10") int limit,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String categoryId
    ) {
        CompanyStatus searchStatus = (status != null) ? status : CompanyStatus.ACTIVE;
        Map<String, Object> rs = companyService.getCompanies(page, searchStatus, limit, keyword, categoryId);
        ApiResponse<Map<String, Object>> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Company Feed",
                rs
        );
        return ResponseEntity.ok(response);
    }

//    @GetMapping("/feed")
//    public ResponseEntity<ApiResponse<PageResponse<CompanyFeedItemResponse>>> getCompanyFeed(
//            @RequestParam(defaultValue = "0") int page,
//            @RequestParam(defaultValue = "10") int size,
//            @RequestParam(defaultValue = "createdAt") String sortBy,
//            @RequestParam(defaultValue = "desc") String direction,
//            @RequestParam(required = false) CompanyStatus status,
//            @RequestParam(required = false) String keyword,
//            @RequestParam(required = false) String categoryId
//    ) {
//        Pageable pageable = PageableUtils.createPageable(page, size, sortBy, direction);
//        CompanyStatus searchStatus = (status != null) ? status : CompanyStatus.ACTIVE;
//        PageResponse<CompanyFeedItemResponse> rs = companyService.getCompanies(searchStatus, keyword, categoryId, pageable);
//        return ResponseEntity.ok(ApiResponse.<PageResponse<CompanyFeedItemResponse>>builder()
//                .code(HttpStatus.OK.value())
//                .message("Lấy danh sách công ty thành công")
//                .result(rs)
//                .build());
//    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CompanyFeedItemResponse>> getCompanyDetail(@PathVariable String id) {
        CompanyFeedItemResponse result = companyService.getCompanyDetail(id);

        ApiResponse<CompanyFeedItemResponse> response = new ApiResponse<>();
        response.setCode(HttpStatus.OK.value());
        response.setResult(result);
        response.setMessage("Chi tiết công ty");

        return ResponseEntity.ok(response);
    }

    @GetMapping("/feedPending")
    public ResponseEntity<ApiResponse<CompanyFeedResponse>> getCompanyFeedPending(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "limit", defaultValue = "10") int limit
    ){
        CompanyFeedResponse rs = companyService.getCompanyPending(page,limit);
        ApiResponse<CompanyFeedResponse> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Pending Company",
                rs);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/feedPending/{companyId}/response")
    public ResponseEntity<ApiResponse<String>> response(
            @PathVariable String companyId,
            @RequestParam(value = "status") String status
    ){
        String rs = companyService.responseCompanies(companyId,status);
        ApiResponse<String> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Phản hồi yêu cầu " + status,
                rs
        );
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
            @RequestPart("request") @Valid CompanyIdentificationRequest request,
            @RequestPart("logo") MultipartFile logoFile,
            @RequestPart("license") MultipartFile licenseFile
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
    public ResponseEntity<ApiResponse<String>> joinCompany(
            @PathVariable String companyId
    ) {
        try {
            String rs = companyService.joinCompany(companyId);

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
    public ResponseEntity<ApiResponse<?>> joinCompanyByRequestId(@Valid @RequestHeader(value = "Authorization") String token, @PathVariable String requestId, @RequestBody RespondToJoinRequest request) {
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
            System.out.println("[RESPOND REQUEST] AppException occurred");
            System.out.println("[RESPOND REQUEST] ErrorCode: " + ex.getErrorCode());
            throw ex;
        }
    }

    @PostMapping("/{companyId}/deactivate")
    public ResponseEntity<ApiResponse<String>> deactivateCompany(
            @PathVariable String companyId,
            @Valid @RequestBody DeactivateRequest request
    ) {
        String rs = companyService.deactivateCompany(companyId, request);
        return ResponseEntity.ok(new ApiResponse<>(HttpStatus.OK.value(), "Success", rs));
    }

    @PostMapping("/{companyId}/reactivate")
    public ResponseEntity<ApiResponse<String>> reactivateCompany(
            @PathVariable String companyId
    ) {
        String rs = companyService.reactivateCompany(companyId);
        return ResponseEntity.ok(new ApiResponse<>(HttpStatus.OK.value(), "Success", rs));
    }

}
