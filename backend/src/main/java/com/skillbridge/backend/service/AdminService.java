package com.skillbridge.backend.service;

import com.skillbridge.backend.dto.request.CategoryRequest;
import com.skillbridge.backend.dto.response.CategoryResponse;
import com.skillbridge.backend.dto.response.CompanyResponse;
import com.skillbridge.backend.dto.response.UserResponse;
import com.skillbridge.backend.entity.Category;
import com.skillbridge.backend.entity.Company;
import com.skillbridge.backend.entity.User;
import com.skillbridge.backend.enums.CompanyStatus;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.repository.CategoryRepository;
import com.skillbridge.backend.repository.CompanyRepository;
import com.skillbridge.backend.repository.UserRepository;
import com.skillbridge.backend.repository.specification.CompanySpecification;
import com.skillbridge.backend.repository.specification.UserSpecification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    public Page<UserResponse> getUsers(String name, String email, String role, String status, Pageable pageable) {
        Specification<User> spec = Specification.where(UserSpecification.hasName(name))
                .and(UserSpecification.hasEmail(email))
                .and(UserSpecification.hasRole(role))
                .and(UserSpecification.hasStatus(status));

        return userRepository.findAll(spec, pageable).map(this::mapToUserResponse);
    }

    @Transactional
    public void banUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        user.setStatus("BANNED");
        userRepository.save(user);
    }

    @Transactional
    public void unbanUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        user.setStatus("ACTIVE");
        userRepository.save(user);
    }

    public Page<CompanyResponse> getCompanies(String name, String taxId, CompanyStatus status, Pageable pageable) {
        Specification<Company> spec = Specification.where(CompanySpecification.hasName(name))
                .and(CompanySpecification.hasTaxId(taxId))
                .and(CompanySpecification.hasStatus(status));

        return companyRepository.findAll(spec, pageable).map(this::mapToCompanyResponse);
    }

    @Transactional
    public void banCompany(String companyId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new AppException(ErrorCode.COMPANY_NOT_FOUND));
        company.setStatus(CompanyStatus.BANNED);
        companyRepository.save(company);
    }

    @Transactional
    public void unbanCompany(String companyId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new AppException(ErrorCode.COMPANY_NOT_FOUND));
        company.setStatus(CompanyStatus.VERIFIED);
        companyRepository.save(company);
    }

    public Page<CategoryResponse> getCategories(Pageable pageable) {
        return categoryRepository.findAll(pageable).map(this::mapToCategoryResponse);
    }

    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        Category category = Category.builder()
                .name(request.getName())
                .build();
        return mapToCategoryResponse(categoryRepository.save(category));
    }

    @Transactional
    public CategoryResponse updateCategory(String id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
        category.setName(request.getName());
        return mapToCategoryResponse(categoryRepository.save(category));
    }

    @Transactional
    public void deleteCategory(String id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
        categoryRepository.delete(category);
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .address(user.getAddress())
                .role(user.getRole())
                .status(user.getStatus())
                .is2faEnabled(user.getIs2faEnabled())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private CompanyResponse mapToCompanyResponse(Company company) {
        return CompanyResponse.builder()
                .id(company.getId())
                .name(company.getName())
                .taxId(company.getTaxId())
                .gpkdUrl(company.getGpkdUrl())
                .imageUrl(company.getImageUrl())
                .status(company.getStatus())
                .description(company.getDescription())
                .address(company.getAddress())
                .websiteUrl(company.getWebsiteUrl())
                .createdAt(company.getCreatedAt())
                .build();
    }

    private CategoryResponse mapToCategoryResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .createdAt(category.getCreatedAt())
                .build();
    }
}
