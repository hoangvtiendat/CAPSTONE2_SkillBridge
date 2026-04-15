package com.skillbridge.backend.controller;

import com.skillbridge.backend.dto.request.CategoryRequest;
import com.skillbridge.backend.dto.response.*;
import com.skillbridge.backend.entity.User;
import com.skillbridge.backend.enums.CompanyStatus;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.service.AdminService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.skillbridge.backend.utils.PageableUtils;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/admin")
public class AdminController {
    AdminService adminService;

    /**
     * Lấy danh sách người dùng
     */
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<Page<User>>> getUsers(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        Pageable pageable = PageableUtils.createPageable(page, size, sortBy, direction);
        Page<User> users = adminService.getUsers(name, email, role, status, pageable);
        ApiResponse<Page<User>> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Lấy danh sách người dùng thành công",
                users
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/stats/overview")
    public ResponseEntity<ApiResponse<SystemStatsResponse>> statsOverview(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        try {
            if (startDate == null) startDate = LocalDate.now().withDayOfMonth(1);
            if (endDate == null) endDate = LocalDate.now();

            SystemStatsResponse rs = adminService.statsOverview(startDate, endDate);
            return ResponseEntity.ok(new ApiResponse<>(HttpStatus.OK.value(), "Thống kê hệ thống", rs));
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
    public ResponseEntity<ApiResponse<Void>> unbanUser(
            @PathVariable String id
    ) {
        adminService.unbanUser(id);
        ApiResponse<Void> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Đã mở khóa người dùng thành công",
                null
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Lấy danh sách công ty
     */
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
        Pageable pageable = PageableUtils.createPageable(page, size, sortBy, direction);
        Page<CompanyResponse> companies = adminService.getCompanies(name, taxId, status, pageable);
        ApiResponse<Page<CompanyResponse>> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Lấy danh sách công ty thành công",
                companies
        );
        return ResponseEntity.ok(response);
    }

    @PutMapping("/companies/{id}/ban")
    public ResponseEntity<ApiResponse<Void>> banCompany(
            @PathVariable String id
    ) {
        adminService.banCompany(id);
        ApiResponse<Void> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Đã khóa công ty thành công",
                null
        );
        return ResponseEntity.ok(response);
    }

    @PutMapping("/companies/{id}/unban")
    public ResponseEntity<ApiResponse<Void>> unbanCompany(
            @PathVariable String id
    ) {
        adminService.unbanCompany(id);
        ApiResponse<Void> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Đã mở khóa công ty thành công",
                null
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/companies/{id}")
    public ResponseEntity<ApiResponse<CompanyResponse>> getCompanyById(
            @PathVariable String id
    ) {
        CompanyResponse company = adminService.getCompanyById(id);
        ApiResponse<CompanyResponse> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Lấy thông tin chi tiết công ty thành công",
                company
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Lấy danh sách ngành nghề
     */
    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<Page<CategoryResponse>>> getCategories(
            @RequestParam(required = false) String name,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        Pageable pageable = PageableUtils.createPageable(page, size, sortBy, direction);
        Page<CategoryResponse> categories = adminService.getCategories(name, pageable);
        ApiResponse<Page<CategoryResponse>> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Lấy danh sách ngành nghề thành công",
                categories
        );

        return ResponseEntity.ok(response);
    }

    @PostMapping("/categories")
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(
            @RequestBody CategoryRequest request
    ) {
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
    public ResponseEntity<ApiResponse<Void>> deleteCategory(
            @PathVariable String id)
    {
        adminService.deleteCategory(id);
        ApiResponse<Void> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Xóa ngành nghề thành công",
                null
        );
        return ResponseEntity.ok(response);
    }
}
