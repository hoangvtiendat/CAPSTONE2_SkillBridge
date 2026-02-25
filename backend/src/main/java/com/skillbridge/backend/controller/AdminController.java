package com.skillbridge.backend.controller;

import com.skillbridge.backend.dto.request.CategoryRequest;
import com.skillbridge.backend.dto.response.ApiResponse;
import com.skillbridge.backend.dto.response.CategoryResponse;
import com.skillbridge.backend.dto.response.CompanyResponse;
import com.skillbridge.backend.dto.response.UserResponse;
import com.skillbridge.backend.enums.CompanyStatus;
import com.skillbridge.backend.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private AdminService adminService;

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
