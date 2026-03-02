package com.skillbridge.backend.controller;

import com.skillbridge.backend.dto.request.CategoryRequest;
import com.skillbridge.backend.dto.response.*;
import com.skillbridge.backend.entity.User;
import com.skillbridge.backend.enums.CompanyStatus;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<Page<UserResponse>>> getUsers(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        Sort sort = direction.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<UserResponse> users = adminService.getUsers(name, email, role, status, pageable);

        ApiResponse<Page<UserResponse>> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Lấy danh sách người dùng thành công",
                users
        );

        return ResponseEntity.ok(response);
    }
    @GetMapping("/stats/overview")
    public ResponseEntity<ApiResponse<SystemStatsResponse>> statsOverview(@Valid @RequestHeader(value = "Authorization") String token) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                throw new AppException(ErrorCode.UNAUTHORIZED);
            }
            String jwt = token.substring(7);
            SystemStatsResponse rs = adminService.statsOverview(jwt);
            ApiResponse<SystemStatsResponse> response = new ApiResponse<>(
                    HttpStatus.OK.value(), "Thống kê hệ thống", rs
            );
            return ResponseEntity.ok(response);
        } catch (AppException ex) {
            System.out.println("[STATS OVERVIEW] AppException occurred");
            System.out.println("[STATS OVERVIEW] ErrorCode: " + ex.getErrorCode());
            throw ex;
        }
    }
    @PutMapping("/users/{id}/ban")
    public ResponseEntity<ApiResponse<Void>> banUser(@PathVariable String id) {
        adminService.banUser(id);
        ApiResponse<Void> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Đã khóa người dùng thành công",
                null
        );
        return ResponseEntity.ok(response);
    }

    @PutMapping("/users/{id}/unban")
    public ResponseEntity<ApiResponse<Void>> unbanUser(@PathVariable String id) {
        adminService.unbanUser(id);
        ApiResponse<Void> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Đã mở khóa người dùng thành công",
                null
        );
        return ResponseEntity.ok(response);
    }

    // Company Management
    @GetMapping("/companies")
    public ResponseEntity<ApiResponse<Page<CompanyResponse>>> getCompanies(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String taxId,
            @RequestParam(required = false) CompanyStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        Sort sort = direction.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<CompanyResponse> companies = adminService.getCompanies(name, taxId, status, pageable);

        ApiResponse<Page<CompanyResponse>> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Lấy danh sách công ty thành công",
                companies
        );

        return ResponseEntity.ok(response);
    }

    @PutMapping("/companies/{id}/ban")
    public ResponseEntity<ApiResponse<Void>> banCompany(@PathVariable String id) {
        adminService.banCompany(id);
        ApiResponse<Void> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Đã khóa công ty thành công",
                null
        );
        return ResponseEntity.ok(response);
    }

    @PutMapping("/companies/{id}/unban")
    public ResponseEntity<ApiResponse<Void>> unbanCompany(@PathVariable String id) {
        adminService.unbanCompany(id);
        ApiResponse<Void> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Đã mở khóa công ty thành công",
                null
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/companies/{id}")
    public ResponseEntity<ApiResponse<CompanyResponse>> getCompanyById(@PathVariable String id) {
        CompanyResponse company = adminService.getCompanyById(id);
        ApiResponse<CompanyResponse> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Lấy thông tin chi tiết công ty thành công",
                company
        );
        return ResponseEntity.ok(response);
    }

    // Category Management
    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<Page<CategoryResponse>>> getCategories(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        Sort sort = direction.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<CategoryResponse> categories = adminService.getCategories(pageable);

        ApiResponse<Page<CategoryResponse>> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Lấy danh sách ngành nghề thành công",
                categories
        );

        return ResponseEntity.ok(response);
    }

    @PostMapping("/categories")
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(@RequestBody CategoryRequest request) {
        CategoryResponse category = adminService.createCategory(request);
        ApiResponse<CategoryResponse> response = new ApiResponse<>(
                HttpStatus.CREATED.value(),
                "Tạo ngành nghề thành công",
                category
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<ApiResponse<CategoryResponse>> updateCategory(
            @PathVariable String id,
            @RequestBody CategoryRequest request
    ) {
        CategoryResponse category = adminService.updateCategory(id, request);
        ApiResponse<CategoryResponse> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Cập nhật ngành nghề thành công",
                category
        );
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable String id) {
        adminService.deleteCategory(id);
        ApiResponse<Void> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Xóa ngành nghề thành công",
                null
        );
        return ResponseEntity.ok(response);
    }
}
