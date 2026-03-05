package com.skillbridge.backend.service;

import com.skillbridge.backend.dto.MonthlyJobDTO;
import com.skillbridge.backend.dto.MonthlyRevenueDTO;
import com.skillbridge.backend.dto.TopCompanyDTO;
import com.skillbridge.backend.dto.request.CategoryRequest;
import com.skillbridge.backend.dto.response.CategoryResponse;
import com.skillbridge.backend.dto.response.CompanyResponse;
import com.skillbridge.backend.dto.response.SystemStatsResponse;
import com.skillbridge.backend.dto.response.UserResponse;
import com.skillbridge.backend.entity.Category;
import com.skillbridge.backend.entity.Company;
import com.skillbridge.backend.entity.User;
import com.skillbridge.backend.enums.CompanyStatus;
import com.skillbridge.backend.enums.JobStatus;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.repository.*;
import com.skillbridge.backend.repository.specification.CompanySpecification;
import com.skillbridge.backend.repository.specification.UserSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final JobRepository jobRepository;
    private final CompanySubscriptionRepository subscriptionRepository;
    private final UserService userService;
    private final CategoryRepository categoryRepository;

    public SystemStatsResponse statsOverview(String token) {
        System.out.println("token: " + token);
        User user = userService.getMe(token);
        System.out.println("user: " + user.getRole());
        if (!"ADMIN".equals(user.getRole())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
        //1.OVERVIEW
        long totalUsers = userRepository.count();
        long totalCompanies = companyRepository.count();
        long totalJobs = jobRepository.count();

        BigDecimal totalRevenue = Optional.ofNullable(subscriptionRepository.sumTotalRevenue()).orElse(BigDecimal.ZERO);

        SystemStatsResponse.OverviewStats overview = SystemStatsResponse.OverviewStats.builder().totalUsers(totalUsers).totalCompanies(totalCompanies).totalJobs(totalJobs).totalRevenue(totalRevenue).build();


        //2.PENDING
        long pendingCompanies = companyRepository.countByStatus(CompanyStatus.PENDING);

        long pendingJobs = jobRepository.countByStatus(JobStatus.PENDING);

        SystemStatsResponse.PendingStats pending = SystemStatsResponse.PendingStats.builder().pendingCompanies(pendingCompanies).pendingJobs(pendingJobs).build();


        LocalDate now = LocalDate.now();
        LocalDate firstDayThisMonth = now.withDayOfMonth(1);
        LocalDate firstDayLastMonth = firstDayThisMonth.minusMonths(1);
        LocalDate firstDayTwoMonthsAgo = firstDayLastMonth.minusMonths(1);

        LocalDateTime thisMonthStart = firstDayThisMonth.atStartOfDay();
        LocalDateTime lastMonthStart = firstDayLastMonth.atStartOfDay();
        LocalDateTime twoMonthsAgoStart = firstDayTwoMonthsAgo.atStartOfDay();

        long usersThisMonth = userRepository.countByCreatedAtAfter(thisMonthStart);

        long usersLastMonth = userRepository.countByCreatedAtBetween(lastMonthStart, thisMonthStart);

        double userGrowth = calculateGrowth(usersLastMonth, usersThisMonth);


        // COMPANY GROWTH
        long companiesThisMonth = companyRepository.countByCreatedAtAfter(thisMonthStart);

        long companiesLastMonth = companyRepository.countByCreatedAtBetween(lastMonthStart, thisMonthStart);

        double companyGrowth = calculateGrowth(companiesLastMonth, companiesThisMonth);

        // JOB GROWTH
        long jobsThisMonth = jobRepository.countByCreatedAtAfter(thisMonthStart);

        long jobsLastMonth = jobRepository.countByCreatedAtBetween(lastMonthStart, thisMonthStart);

        double jobGrowth = calculateGrowth(jobsLastMonth, jobsThisMonth);


        //  REVENUE GROWTH
        BigDecimal revenueThisMonth = Optional.ofNullable(subscriptionRepository.sumRevenueBetween(thisMonthStart, LocalDateTime.now())).orElse(BigDecimal.ZERO);

        BigDecimal revenueLastMonth = Optional.ofNullable(subscriptionRepository.sumRevenueBetween(lastMonthStart, thisMonthStart)).orElse(BigDecimal.ZERO);

        double revenueGrowth = calculateRevenueGrowth(revenueLastMonth, revenueThisMonth);


        SystemStatsResponse.GrowthStats growth = SystemStatsResponse.GrowthStats.builder().userGrowthPercent(userGrowth).companyGrowthPercent(companyGrowth).jobGrowthPercent(jobGrowth).revenueGrowthPercent(revenueGrowth).build();

        //4. CHART DATA
        LocalDateTime sixMonthsAgo = LocalDate.now().minusMonths(5).withDayOfMonth(1).atStartOfDay();

        List<MonthlyRevenueDTO> rawRevenue = subscriptionRepository.revenueLast6Months(sixMonthsAgo);

        List<MonthlyJobDTO> rawJobs = jobRepository.jobGrowthLast6Months(sixMonthsAgo);

        List<MonthlyRevenueDTO> revenueByMonth = buildFullLast6MonthsRevenueData(rawRevenue);

        List<MonthlyJobDTO> jobGrowthByMonth = buildFullLast6MonthsJobData(rawJobs);

        SystemStatsResponse.ChartSection charts = SystemStatsResponse.ChartSection.builder().revenueByMonth(revenueByMonth).jobGrowthByMonth(jobGrowthByMonth).build();


        // 5. TOP COMPANY
        List<TopCompanyDTO> topCompanies = companyRepository.findTop5ByJobCount(PageRequest.of(0, 5));


        return new SystemStatsResponse(overview, growth, pending, charts, topCompanies);
    }

    // BUILD FULL 6 MONTHS - JOB
    private List<MonthlyJobDTO> buildFullLast6MonthsJobData(List<MonthlyJobDTO> rawData) {

        Map<Integer, Long> dataMap = rawData.stream().collect(Collectors.toMap(MonthlyJobDTO::getMonth, MonthlyJobDTO::getTotalJobs));

        List<MonthlyJobDTO> result = new ArrayList<>();
        LocalDate now = LocalDate.now();

        for (int i = 5; i >= 0; i--) {
            int month = now.minusMonths(i).getMonthValue();

            result.add(new MonthlyJobDTO(month, dataMap.getOrDefault(month, 0L)));
        }

        return result;
    }

    // BUILD FULL 6 MONTHS - REVENUE
    private List<MonthlyRevenueDTO> buildFullLast6MonthsRevenueData(List<MonthlyRevenueDTO> rawData) {

        Map<Integer, BigDecimal> dataMap = rawData.stream().collect(Collectors.toMap(MonthlyRevenueDTO::getMonth, MonthlyRevenueDTO::getRevenue));

        List<MonthlyRevenueDTO> result = new ArrayList<>();
        LocalDate now = LocalDate.now();

        for (int i = 5; i >= 0; i--) {
            int month = now.minusMonths(i).getMonthValue();

            result.add(new MonthlyRevenueDTO(month, dataMap.getOrDefault(month, BigDecimal.ZERO)));
        }

        return result;
    }

    // CALCULATE GROWTH
    private double calculateGrowth(long oldValue, long newValue) {
        if (oldValue == 0) {
            return newValue > 0 ? 100 : 0;
        }
        return ((double) (newValue - oldValue) / oldValue) * 100;
    }

    private double calculateRevenueGrowth(BigDecimal oldValue, BigDecimal newValue) {

        if (oldValue.compareTo(BigDecimal.ZERO) == 0) {
            return newValue.compareTo(BigDecimal.ZERO) > 0 ? 100 : 0;
        }

        return newValue.subtract(oldValue).divide(oldValue, 4, BigDecimal.ROUND_HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue();
    }

    public Page<UserResponse> getUsers(String name, String email, String role, String status, Pageable pageable) {
        Specification<User> spec = Specification.where(UserSpecification.hasName(name))
                .and(UserSpecification.hasEmail(email))
                .and(UserSpecification.hasRole(role))
                .and(UserSpecification.hasStatus(status))
                .and(UserSpecification.isNotAdmin());

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
        company.setStatus(CompanyStatus.BAN);
        companyRepository.save(company);
    }

    @Transactional
    public void unbanCompany(String companyId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new AppException(ErrorCode.COMPANY_NOT_FOUND));
        company.setStatus(CompanyStatus.ACTIVE);
        companyRepository.save(company);
    }
    public CompanyResponse getCompanyById(String id) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.COMPANY_NOT_FOUND));
        return mapToCompanyResponse(company);
    }

    public Page<CategoryResponse> getCategories(Pageable pageable) {
        return categoryRepository.findAll(pageable).map(this::mapToCategoryResponse);
    }

    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        // Loại bỏ khoảng trắng thừa đầu cuối và thay thế 2+ khoảng trắng ở giữa bằng 1 khoảng trắng
        String normalizedName = request.getName().trim().replaceAll("\\s+", " ");
        
        if (categoryRepository.existsByNameIgnoreCase(normalizedName)) {
            throw new AppException(ErrorCode.CATEGORY_EXIST);
        }
        Category category = Category.builder()
                .name(normalizedName)
                .build();
        return mapToCategoryResponse(categoryRepository.save(category));
    }


    @Transactional
    public CategoryResponse updateCategory(String id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        // Loại bỏ khoảng trắng thừa đầu cuối và thay thế 2+ khoảng trắng ở giữa bằng 1 khoảng trắng
        String normalizedName = request.getName().trim().replaceAll("\\s+", " ");
        
        if (!category.getName().equalsIgnoreCase(normalizedName) && categoryRepository.existsByNameIgnoreCase(normalizedName)) {
            throw new AppException(ErrorCode.CATEGORY_EXIST);
        }

        category.setName(normalizedName);
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
                .gpkdUrl(company.getBusinessLicenseUrl())
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
