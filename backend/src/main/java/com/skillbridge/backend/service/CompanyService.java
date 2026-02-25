package com.skillbridge.backend.service;

import com.skillbridge.backend.dto.request.CompanyIdentificationRequest;
import com.skillbridge.backend.dto.response.CompanyFeedItemResponse;
import com.skillbridge.backend.dto.response.CompanyFeedResponse;
import com.skillbridge.backend.entity.Company;
import com.skillbridge.backend.entity.CompanyJoinRequest;
import com.skillbridge.backend.entity.CompanyMember;
import com.skillbridge.backend.entity.User;
import com.skillbridge.backend.enums.CompanyRole;
import com.skillbridge.backend.enums.CompanyStatus;
import com.skillbridge.backend.enums.JoinRequestStatus;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.repository.CompanyJoinRequestRepository;
import com.skillbridge.backend.repository.CompanyRepository;
import com.skillbridge.backend.repository.SubscriptionPlanRepository;
import com.skillbridge.backend.repository.companyMemberRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CompanyService {

    @Autowired
    private OtpService otpService;

    private final com.skillbridge.backend.repository.companyMemberRepository companyMemberRepository;
    private final UserService userService;
    private final CompanyRepository companyRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final CompanyJoinRequestRepository companyJoinRequestRepository;

    public CompanyService(CompanyRepository companyRepository, SubscriptionPlanRepository subscriptionPlanRepository, companyMemberRepository companyMemberRepository, UserService userService, CompanyJoinRequestRepository companyJoinRequestRepository) {
        this.companyRepository = companyRepository;
        this.subscriptionPlanRepository = subscriptionPlanRepository;
        this.companyMemberRepository = companyMemberRepository;
        this.userService = userService;
        this.companyJoinRequestRepository = companyJoinRequestRepository;
    }

    public CompanyFeedResponse getCompanies(String cursor, CompanyStatus status, int limit) {
        Pageable pageable = PageRequest.of(0, limit + 1);
        List<CompanyFeedItemResponse> companies = companyRepository.getCompanyFeed(cursor, status, pageable);
        boolean hasMore = companies.size() > limit;
        String nextCursor = null;

        if (hasMore) {
            companies.remove(limit);
            nextCursor = companies.get(companies.size() - 1).getId();
        }
        return new CompanyFeedResponse(companies, nextCursor, hasMore);
    }

    public CompanyFeedItemResponse getCompanyByTax(String taxCode) {
        Optional<Company> companyOpt = companyRepository.findCompaniesByTaxId(taxCode);

        if (companyOpt.isPresent()) {
            Company company = companyOpt.get();
            String planName = company.getCurrentSubscriptionPlanName();
            return new CompanyFeedItemResponse(company.getId(), company.getName(), company.getTaxId(), company.getBusinessLicenseUrl(), company.getImageUrl(), company.getDescription(), company.getAddress(), company.getWebsiteUrl(), company.getStatus(), planName);
        }
        throw new AppException(ErrorCode.COMPANY_NOT_FOUND);
    }

    public CompanyFeedItemResponse identifyCompany(CompanyIdentificationRequest request) {

        Optional<Company> companyOpt = companyRepository.findCompaniesByTaxId(request.getTaxcode());

        if (companyOpt.isPresent()) {
            throw new AppException(ErrorCode.COMPANY_EXIST);
        }

        Company company = new Company();

        company.setName(request.getName());
        company.setTaxId(request.getTaxcode());
        company.setBusinessLicenseUrl(request.getBusinessLicenseUrl());
        company.setImageUrl(request.getImageUrl());
        company.setDescription(request.getDescription());
        company.setAddress(request.getAddress());
        company.setWebsiteUrl(request.getWebsiteUrl());
        company.setStatus(CompanyStatus.PENDING);
        companyRepository.saveAndFlush(company);

        String planName = company.getCurrentSubscriptionPlanName();

        return new CompanyFeedItemResponse(company.getId(), company.getName(), company.getTaxId(), company.getBusinessLicenseUrl(), company.getImageUrl(), company.getDescription(), company.getAddress(), company.getWebsiteUrl(), company.getStatus(), planName);
    }

    public String joinCompany(String companyId, String token) {
        User user = userService.getMe(token);
        Company company = companyRepository.findById(companyId).orElseThrow(() -> new AppException(ErrorCode.COMPANY_NOT_FOUND));
        Optional<CompanyMember> existingMember = companyMemberRepository.findByCompany_IdAndUser_Id(companyId, user.getId());

        if (existingMember.isPresent()) {

            CompanyRole role = existingMember.get().getRole();

            if (role == CompanyRole.ADMIN) {
                throw new AppException(ErrorCode.YOU_ARE_ADMIN);
            }

            if (role == CompanyRole.MEMBER) {
                throw new AppException(ErrorCode.YOU_ARE_MEMBER);
            }
        }

        Optional<CompanyJoinRequest> existingRequest = companyJoinRequestRepository.findByCompany_IdAndUser_IdAndStatus(companyId, user.getId(), JoinRequestStatus.PENDING);

        if (existingRequest.isPresent()) {
            throw new AppException(ErrorCode.REQUEST_ALREADY_SENT);
        }

        CompanyJoinRequest joinRequest = CompanyJoinRequest.builder().company(company).user(user).status(JoinRequestStatus.PENDING).build();

        companyJoinRequestRepository.save(joinRequest);

        List<CompanyMember> admins = companyMemberRepository.findByCompany_IdAndRole(companyId, CompanyRole.ADMIN);

        if (admins.isEmpty()) {
            throw new AppException(ErrorCode.HAS_NO_ADMIN);
        }

        String subject = "[SkillBridge] Yêu cầu tham gia công ty";

        for (CompanyMember adminMember : admins) {

            User admin = adminMember.getUser();
            String adminEmail = admin.getEmail();

            String content = "<div style=\"font-family: Arial; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;\">" + "<h2 style=\"color:#1a73e8\">Yêu cầu tham gia công ty</h2>" + "<p>Xin chào,</p>" + "<p><b>" + user.getName() + "</b> đã gửi yêu cầu tham gia công ty của bạn.</p>" + "<p>Email người gửi: " + user.getEmail() + "</p>" + "<p>Vui lòng đăng nhập hệ thống để phê duyệt hoặc từ chối yêu cầu này.</p>" + "<br>" + "<p style=\"font-size:12px;color:#888\">Trân trọng,<br>SkillBridge Team</p>" + "</div>";

            otpService.sendOtpEmail(adminEmail, subject, content);
        }

        return "Yêu cầu tham gia đã được gửi đến admin công ty";
    }

    public String respondToJoinRequest(String requestId, String status, String token) {
        System.out.println("Status: " + status);
        User currentUser = userService.getMe(token);

        CompanyJoinRequest joinRequest = companyJoinRequestRepository
                .findById(requestId)
                .orElseThrow(() -> new AppException(ErrorCode.JOIN_REQUEST_NOT_FOUND));

        Company company = joinRequest.getCompany();
        String companyId = company.getId();

        CompanyMember adminCheck = companyMemberRepository
                .findByCompany_IdAndUser_Id(companyId, currentUser.getId())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_COMPANY_MEMBER));

        if (adminCheck.getRole() != CompanyRole.ADMIN) {
            throw new AppException(ErrorCode.NOT_COMPANY_ADMIN);
        }

        if (joinRequest.getStatus() != JoinRequestStatus.PENDING) {
            throw new AppException(ErrorCode.JOIN_REQUEST_ALREADY_PROCESSED);
        }

        JoinRequestStatus newStatus;
        try {
            newStatus = JoinRequestStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new AppException(ErrorCode.INVALID_STATUS);
        }

        if (newStatus != JoinRequestStatus.APPROVED &&
                newStatus != JoinRequestStatus.REJECTED) {
            throw new AppException(ErrorCode.INVALID_STATUS);
        }

        joinRequest.setStatus(newStatus);
        companyJoinRequestRepository.save(joinRequest);

        User requestUser = joinRequest.getUser();

        if (newStatus == JoinRequestStatus.APPROVED) {
            company.setStatus(CompanyStatus.ACTIVE);
            companyRepository.save(company);
            boolean alreadyMember = companyMemberRepository
                    .findByCompany_IdAndUser_Id(companyId, requestUser.getId())
                    .isPresent();

            if (!alreadyMember) {
                CompanyMember newMember = new CompanyMember();
                newMember.setCompany(company);
                newMember.setUser(requestUser);
                newMember.setRole(CompanyRole.MEMBER);

                companyMemberRepository.save(newMember);
            }
        } else if (newStatus == JoinRequestStatus.REJECTED) {
            company.setStatus(CompanyStatus.BAN);
            companyRepository.save(company);
        }

        String subject = "[SkillBridge] Kết quả yêu cầu tham gia công ty";
        String content =
                "<div style=\"font-family: Arial; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;\">" +
                        "<h2 style=\"color:#1a73e8\">Kết quả yêu cầu tham gia</h2>" +
                        "<p>Xin chào <b>" + requestUser.getName() + "</b>,</p>" +
                        "<p>Yêu cầu tham gia công ty <b>" + company.getName() + "</b> của bạn đã được xử lý.</p>" +
                        "<p>Trạng thái: <b>" + newStatus.name() + "</b></p>" +
                        "<br>" +
                        "<p style=\"font-size:12px;color:#888\">Trân trọng,<br>SkillBridge Team</p>" +
                        "</div>";
        otpService.sendOtpEmail(requestUser.getEmail(), subject, content);

        return "Xử lý yêu cầu thành công";
    }
}
