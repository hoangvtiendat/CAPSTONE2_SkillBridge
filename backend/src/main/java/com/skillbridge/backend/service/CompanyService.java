package com.skillbridge.backend.service;

import com.skillbridge.backend.config.CustomUserDetails;
import com.skillbridge.backend.dto.CompanyDTO;
import com.skillbridge.backend.dto.request.CompanyIdentificationRequest;
import com.skillbridge.backend.dto.request.DeactivateRequest;
import com.skillbridge.backend.dto.response.CompanyFeedItemResponse;
import com.skillbridge.backend.dto.response.CompanyFeedResponse;
import com.skillbridge.backend.entity.*;
import com.skillbridge.backend.enums.*;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.repository.*;
import com.skillbridge.backend.utils.SecurityUtils;
import com.skillbridge.backend.utils.ValidateUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CompanyService {
    String UPLOAD_DIR = "uploads/";
    OtpService otpService;
    CompanyMemberRepository companyMemberRepository;
    CompanyRepository companyRepository;
    CompanyJoinRequestRepository companyJoinRequestRepository;
    FileStorageService fileStorageService;
    JobRepository jobRepository;
    UserRepository userRepository;
    SystemLogService systemLogService;
    SecurityUtils securityUtils;
    NotificationService notificationService;
    SimpMessagingTemplate messagingTemplate;
    ValidateUtils validate;
    SubscriptionOfCompanyRepository subscriptionOfCompanyRepository;
    SubscriptionPlanRepository subscriptionPlanRepository;

    public Map<String, Object> getCompanies(int page, CompanyStatus status, int limit, String keyword, String categoryId) {
        Pageable pageable = PageRequest.of(page, limit);
        Page<CompanyFeedItemResponse> companyPage;

        if ((keyword != null && !keyword.trim().isEmpty()) || (categoryId != null && !categoryId.trim().isEmpty())) {
            String searchKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
            String searchCategoryId = (categoryId != null && !categoryId.trim().isEmpty()) ? categoryId.trim() : null;
            companyPage = companyRepository.getCompanyFeedSearch(status, searchKeyword, searchCategoryId, pageable);
        } else {
            companyPage = companyRepository.getCompanyFeed(status,SubscriptionOfCompanyStatus.OPEN, pageable);
        }

        return Map.of(
                "companies", companyPage.getContent(),
                "totalPages", companyPage.getTotalPages(),
                "totalElements", companyPage.getTotalElements(),
                "currentPage", companyPage.getNumber()
        );
    }

    public CompanyFeedResponse getCompanyPending(int page, int limit){
        try{
            Pageable pageable = PageRequest.of(page, limit);

            Page<CompanyFeedItemResponse> companies = companyRepository.getCompanyFeedPending(pageable);

            if(companies.isEmpty()){
                return new CompanyFeedResponse(List.of(), 0, 0, page);
            }
            List<CompanyFeedItemResponse> result = companies.getContent();

            return new CompanyFeedResponse(result, companies.getTotalPages(), companies.getTotalElements(), companies.getNumber());
        }catch(Exception e){
            System.out.println("Loi" + e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }






    /** ADMIN phản hồi yêu cầu từ công ty */
    @Transactional
    public String responseCompanies(String id,String status){
        CustomUserDetails currentUser = securityUtils.getCurrentUser();
        try{
            Company company = companyRepository.findById(id)
                    .orElseThrow(() -> new AppException(ErrorCode.COMPANY_NOT_FOUND));

            List<CompanyMember> members = companyMemberRepository.findByCompany_Id(company.getId());

            if (members.isEmpty()) {
                throw new AppException(ErrorCode.MEMBER_NOT_FOUND);
            }

            CompanyMember creator = members.get(0); // Lấy người đầu tiên
            User userCreator = creator.getUser();
            User user = userRepository.findById(userCreator.getId()).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
            String subject = "[SkillBridge] Thông báo kết quả duyệt hồ sơ công ty";
            String content = "";

            if("ACTIVE".equals(status)){
                company.setStatus(CompanyStatus.ACTIVE);
                user.setRole("RECRUITER");

                SubscriptionPlan freePlan = subscriptionPlanRepository.findByName(SubscriptionPlanStatus.FREE)
                        .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));

                SubscriptionOfCompany freeSubscription = SubscriptionOfCompany.builder()
                        .company(company)
                        .name(freePlan.getName())
                        .jobLimit(freePlan.getJobLimit())
                        .candidateViewLimit(freePlan.getCandidateViewLimit())
                        .postingDuration(freePlan.getPostingDuration())
                        .hasPriorityDisplay(freePlan.getHasPriorityDisplay())
                        .price(freePlan.getPrice())
                        .currentJobCount(0)
                        .currentViewCount(0)
                        .status(SubscriptionOfCompanyStatus.OPEN)
                        .startDate(LocalDateTime.now())
                        .endDate(LocalDateTime.now().plusYears(10))
                        .isActive(true)
                        .build();

                subscriptionOfCompanyRepository.save(freeSubscription);

                content = String.format(
                    "<div style='font-family: Arial; padding: 20px; border: 1px solid #ddd; border-radius: 8px;'>" +
                            "<h2 style='color: #28a745;'>Chúc mừng! Công ty của bạn đã được duyệt</h2>" +
                            "<p>Chào <b>%s</b>,</p>" +
                            "<p>Yêu cầu đăng ký công ty <b>%s</b> của bạn đã được quản trị viên hệ thống phê duyệt.</p>" +
                            "<p>Hiện tại bạn đã có quyền <b>Quản trị viên (Recruiter)</b> để đăng tin tuyển dụng và quản lý nhân sự cho công ty.</p>" +
                            "<p>Vui lòng đăng nhập để trải nghiệm các tính năng dành cho doanh nghiệp.</p>" +
                            "<br><p>Trân trọng,<br>SkillBridge Team</p></div>",
                        user.getName(), company.getName()
                );
                systemLogService.info(currentUser, "Admin phê duyệt công ty: " + company.getName());
            }else{
                company.setStatus(CompanyStatus.BAN);
                content = String.format(
                    "<div style='font-family: Arial; padding: 20px; border: 1px solid #ddd; border-radius: 8px;'>" +
                            "    <h2 style='color: #dc3545;'>Thông báo từ chối hồ sơ</h2>" +
                            "    <p>Chào <b>%s</b>,</p>" +
                            "    <p>Rất tiếc, hồ sơ đăng ký công ty <b>%s</b> của bạn đã bị từ chối/khóa bởi quản trị viên hệ thống.</p>" +
                            "    <p><b>Lưu ý:</b> Nếu bạn cho rằng đây là một sự nhầm lẫn, vui lòng liên hệ với bộ phận hỗ trợ của chúng tôi để được giải quyết.</p>" +
                            "    <br><p>Trân trọng,<br><b>SkillBridge Team</b></p>" +
                            "</div>",
                        user.getName(), company.getName()
                );
                systemLogService.warn(currentUser, "Admin từ chối/ban công ty: " + company.getName());
            }
            companyRepository.save(company);
            notificationService.createNotification(
                    user,
                    null,
                    subject,
                    content,
                    "COMPANY_MODERATION",
                    "/companies/" + id,
                    true
            );

            messagingTemplate.convertAndSend("/topic/companies", id);

            return "Duyệt yêu cầu tạo công ty thành công";
        }catch(Exception e){
            System.out.println("Loi" + e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    /** Xem chi tiết công ty */
    public CompanyFeedItemResponse getCompanyDetail(String id) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.COMPANY_NOT_FOUND));

        SubscriptionPlanStatus planName = company.getCurrentSubscriptionPlanName();
        return new CompanyFeedItemResponse(
                company.getId(), company.getName(), company.getTaxId(),
                company.getBusinessLicenseUrl(), company.getImageUrl(),
                company.getDescription(), company.getAddress(),
                company.getWebsiteUrl(), company.getStatus(),planName,company.getCreatedAt(),0
        );
    }

    /** Tra cứu công ty theo mã số thuế trên trang tratenongty */
    public CompanyDTO lookupByTaxCode(String mst) {
        validate.validateTaxId(mst);
        CustomUserDetails currentUser = securityUtils.getCurrentUser();
        String cleanMst = mst.trim();
        try {
            String searchUrl = "https://www.tratencongty.com/search/" + cleanMst;
            Document searchDoc = Jsoup.connect(searchUrl)
                    .userAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36")
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .data("q", cleanMst)
                    .method(org.jsoup.Connection.Method.POST)
                    .timeout(15000)
                    .followRedirects(true)
                    .post();
            CompanyDTO result = null;

            if (searchDoc.location().contains("/company/")) {
                result = parseTraTenCongTy(searchDoc, cleanMst);
            } else {
                Element firstLink = searchDoc.selectFirst(".search-results a[href*='/company/']");
                if (firstLink != null) {
                    String detailUrl = firstLink.absUrl("href");
                    Document detailDoc = Jsoup.connect(detailUrl)
                            .userAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36")
                            .get();
                    result = parseTraTenCongTy(detailDoc, cleanMst);
                }
            }
            if (result != null) {
                systemLogService.info(currentUser, "Tra cứu MST thành công: " + cleanMst + " - " + result.getName());
            } else {
                systemLogService.warn(currentUser, "Tra cứu MST không tìm thấy kết quả: " + cleanMst);
            }
            return result;
        } catch (Exception e) {
            systemLogService.danger(currentUser, "Lỗi hệ thống khi tra cứu MST " + cleanMst + ": " + e.getMessage());
            return null;
        }
    }

    /** hàm hỗ trợ lấy thông tin công ty */
    private CompanyDTO parseTraTenCongTy(Document doc, String mst) {
        CompanyDTO dto = new CompanyDTO();
        dto.setTaxCode(mst);
        Element jumbotron = doc.selectFirst(".jumbotron");
        if (jumbotron != null) {
            Element mainTitle = doc.selectFirst("h4, h1");
            if (mainTitle != null) {
                dto.setName(mainTitle.text().trim().toUpperCase());
            }
            Elements allBase64Imgs = jumbotron.select("img[src^=data:image]");

            Element phoneLabel = jumbotron.getElementsContainingOwnText("Điện thoại").first();
            if (phoneLabel != null && allBase64Imgs.size() >= 2) {
                String phoneSrc = allBase64Imgs.get(1).attr("src");
                dto.setPhoneImg(phoneSrc);
            }

            String rawHtml = jumbotron.html();
            String textLines = Jsoup.clean(rawHtml, "", org.jsoup.safety.Safelist.none()
                    .addTags("br")).replace("<br>", "\n");
            for (String line : textLines.split("\n")) {
                String cleanLine = line.trim();
                String lowerLine = cleanLine.toLowerCase();

                if (lowerLine.contains("tên giao dịch:")) {
                    String val = cleanLine.split(":", 2)[1].trim();
                    if (dto.getName() == null) dto.setName(val.toUpperCase());
                } else if (lowerLine.contains("địa chỉ:")) {
                    dto.setAddress(cleanLine.split(":", 2)[1].trim());
                } else if (lowerLine.contains("đại diện pháp luật:")) {
                    dto.setRepresentative(cleanLine.split(":", 2)[1].trim());
                } else if (lowerLine.contains("ngày cấp giấy phép:")) {
                    dto.setLicenseDate(cleanLine.split(":", 2)[1].trim());
                } else if (lowerLine.contains("ngày hoạt động:")) {
                    dto.setStartDate(cleanLine.split(":", 2)[1].trim());
                } else if (lowerLine.contains("trạng thái:")) {
                    dto.setStatus(cleanLine.split(":", 2)[1].trim());
                }
            }
        }
        return dto;
    }

    /** Lấy thông tin công ty dựa vào mã số thuế */
    public CompanyFeedItemResponse getCompanyByTax(String taxCode) {
        validate.validateTaxId(taxCode);
        Optional<Company> companyOpt = companyRepository.findByTaxId(taxCode);

        if (companyOpt.isPresent()) {
            Company company = companyOpt.get();
            SubscriptionPlanStatus planName = company.getCurrentSubscriptionPlanName();
            return new CompanyFeedItemResponse(
                    company.getId(), company.getName(),
                    company.getTaxId(), company.getBusinessLicenseUrl(),
                    company.getImageUrl(), company.getDescription(),
                    company.getAddress(), company.getWebsiteUrl(),
                    company.getStatus(), planName,company.getCreatedAt(),0);
        }
        throw new AppException(ErrorCode.COMPANY_NOT_FOUND);
    }

    public CompanyFeedItemResponse identifyCompany(CompanyIdentificationRequest request,
                                                   MultipartFile logo,
                                                   MultipartFile license) throws IOException {
        validate.validateTaxId(request.getTaxcode());

        CustomUserDetails currentUser = securityUtils.getCurrentUser();

        User user = userRepository.findById(currentUser.getUserId()).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        Optional<Company> companyOpt = companyRepository.findByTaxId(request.getTaxcode());
        if (companyOpt.isPresent()) {
            systemLogService.warn(currentUser, "Đăng ký trùng MST: " + request.getTaxcode());
            throw new AppException(ErrorCode.COMPANY_EXIST);
        }

        String logoUrl = fileStorageService.saveFile(logo, "logos");
        String licenseUrl = fileStorageService.saveFile(license, "licenses");

        Company company = new Company();
        company.setName(request.getName());
        company.setTaxId(request.getTaxcode());
        company.setBusinessLicenseUrl(licenseUrl);
        company.setImageUrl(logoUrl);
        company.setDescription(request.getDescription());
        company.setAddress(request.getAddress());
        company.setWebsiteUrl(request.getWebsiteUrl());
        company.setStatus(CompanyStatus.PENDING);

        companyRepository.saveAndFlush(company);

        CompanyMember companyMember = new CompanyMember();
        companyMember.setRole(CompanyRole.ADMIN);
        companyMember.setCompany(company);
        companyMember.setUser(user);

        companyMemberRepository.save(companyMember);

        systemLogService.info(currentUser, "Yêu cầu tạo công ty mới: " + company.getName());
        Map<String, Object> adminPayload = Map.of(
                "type", "NEW_COMPANY_REGISTRATION",
                "companyId", company.getId(),
                "companyName", company.getName(),
                "taxCode", company.getTaxId()
        );

        messagingTemplate.convertAndSend("/topic/admin-notifications", (Object) adminPayload);

        SubscriptionPlanStatus planName = company.getCurrentSubscriptionPlanName();
        return new CompanyFeedItemResponse(
                company.getId(), company.getName(), company.getTaxId(),
                company.getBusinessLicenseUrl(), company.getImageUrl(),
                company.getDescription(), company.getAddress(),
                company.getWebsiteUrl(), company.getStatus(), planName,company.getCreatedAt(),0
        );
    }
    /** Yêu cầu gia nhập công ty nếu công ty đã tồn tại */
    @Transactional
    public String joinCompany(String companyId) {
        CustomUserDetails currentUser = securityUtils.getCurrentUser();
        User user = userRepository.findById(currentUser.getUserId()).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        Company company = companyRepository.findById(companyId).orElseThrow(() -> new AppException(ErrorCode.COMPANY_NOT_FOUND));
        Optional<CompanyMember> existingMember = companyMemberRepository.findByCompany_IdAndUser_Id(companyId, currentUser.getUserId());

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
        List<CompanyMember> admins = companyMemberRepository.findByCompany_IdAndRole(companyId, CompanyRole.ADMIN);
        if (admins.isEmpty()) {
            throw new AppException(ErrorCode.HAS_NO_ADMIN);
        }

        CompanyJoinRequest joinRequest = CompanyJoinRequest.builder().company(company).user(user).status(JoinRequestStatus.PENDING).build();
        companyJoinRequestRepository.save(joinRequest);

        systemLogService.info(currentUser, "Gửi yêu cầu gia nhập công ty: " + company.getName());
        String subject = "[SkillBridge] Yêu cầu tham gia công ty";
        for (CompanyMember adminMember : admins) {
            User admin = adminMember.getUser();
            String adminEmail = admin.getEmail();
            String content = "<div style=\"font-family: Arial; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;\">" + "<h2 style=\"color:#1a73e8\">Yêu cầu tham gia công ty</h2>" + "<p>Xin chào,</p>" + "<p><b>" + user.getName() + "</b> đã gửi yêu cầu tham gia công ty của bạn.</p>" + "<p>Email người gửi: " + user.getEmail() + "</p>" + "<p>Vui lòng đăng nhập hệ thống để phê duyệt hoặc từ chối yêu cầu này.</p>" + "<br>" + "<p style=\"font-size:12px;color:#888\">Trân trọng,<br>SkillBridge Team</p>" + "</div>";
            notificationService.createNotification(
                    admin,
                    null,
                    subject,
                    content,
                    "JOIN_REQUEST",
                    "/company/requests",
                    true
            );
            otpService.sendOtpEmail(admin.getEmail(), subject, content);
        }
        return "Yêu cầu tham gia đã được gửi đến admin công ty";
    }


    /** Admin công ty duyệt thành viên vào công ty */
    @Transactional
    public String respondToJoinRequest(String requestId, String status, String token) {
        CustomUserDetails adminDetails = securityUtils.getCurrentUser();

        CompanyJoinRequest joinRequest = companyJoinRequestRepository.findById(requestId)
                .orElseThrow(() -> new AppException(ErrorCode.JOIN_REQUEST_NOT_FOUND));

        Company company = joinRequest.getCompany();
        User requestUser = joinRequest.getUser();

        CompanyMember adminCheck = companyMemberRepository
                .findByCompany_IdAndUser_Id(company.getId(), adminDetails.getUserId())
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

        if (newStatus == JoinRequestStatus.APPROVED) {
            joinRequest.setStatus(JoinRequestStatus.APPROVED);
            boolean alreadyMember = companyMemberRepository
                    .findByCompany_IdAndUser_Id(company.getId(), requestUser.getId())
                    .isPresent();

            if (!alreadyMember) {
                CompanyMember newMember = new CompanyMember();
                newMember.setCompany(company);
                newMember.setUser(requestUser);
                newMember.setRole(CompanyRole.MEMBER);
                companyMemberRepository.save(newMember);
            }
            systemLogService.info(adminDetails, "Phê duyệt thành viên " + requestUser.getName() + " vào công ty " + company.getName());
        } else if (newStatus == JoinRequestStatus.REJECTED) {
            joinRequest.setStatus(JoinRequestStatus.REJECTED);
            systemLogService.warn(adminDetails, "Từ chối thành viên " + requestUser.getName() + " gia nhập công ty " + company.getName());
        } else {
            throw new AppException(ErrorCode.INVALID_STATUS);
        }
        companyJoinRequestRepository.save(joinRequest);

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
        notificationService.createNotification(
                requestUser,
                null,
                subject,
                content,
                "JOIN_RESULT",
                "/my-companies",
                true
        );
        otpService.sendOtpEmail(requestUser.getEmail(), subject, content);
        return "Xử lý yêu cầu thành công";
    }

    /** Vô hiệu hoá công ty */
    @Transactional
    public String deactivateCompany(String companyId, DeactivateRequest request) {
        CustomUserDetails currentUser = securityUtils.getCurrentUser();

        // 1. Kiểm tra Permission (Phải là Admin của công ty)
        CompanyMember adminMember = companyMemberRepository.findByCompany_IdAndUser_Id(companyId, currentUser.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_COMPANY_MEMBER));

        if (adminMember.getRole() != CompanyRole.ADMIN) {
            throw new AppException(ErrorCode.NOT_COMPANY_ADMIN);
        }

        // 2. Kiểm tra Confirmation Code
        if (!"DEACTIVATE".equals(request.getConfirmationCode())) {
            throw new AppException(ErrorCode.INVALID_CONFIRMATION_CODE);
        }

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new AppException(ErrorCode.COMPANY_NOT_FOUND));

        if (company.getStatus() == CompanyStatus.DEACTIVATED) {
            throw new AppException(ErrorCode.COMPANY_ALREADY_DEACTIVATED);
        }

        // 3. Thực hiện vô hiệu hóa
        company.setStatus(CompanyStatus.DEACTIVATED);
        companyRepository.save(company);

        // 4. Ẩn tất cả Jobs
        jobRepository.updateStatusByCompanyId(companyId, JobStatus.LOCK);

        // 5. Audit Log
        systemLogService.danger(currentUser, "VÔ HIỆU HÓA CÔNG TY: " + company.getName() + " (ID: " + companyId + ")");

        // 6. Gửi Email thông báo cho tất cả thành viên (trừ người thực hiện nếu cần, nhưng thường gửi hết)
        List<CompanyMember> members = companyMemberRepository.findByCompany_Id(companyId);
        String subject = "[SkillBridge] Thông báo vô hiệu hóa tài khoản công ty";

        for (CompanyMember member : members) {
            User u = member.getUser();
            if (u == null) continue;

            // Invalidate session
            u.setRefreshToken(null);
            userRepository.save(u);

            // Gửi email thông báo
            if (u.getEmail() != null) {
                String content =
                    "<div style=\"font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 20px auto; padding: 30px; border-radius: 12px; background-color: #ffffff; border: 1px solid #e1e4e8; color: #333;\">" +
                    "    <h2 style=\"color: #ef4444; text-align: center; margin-top: 0;\">Thông báo vô hiệu hóa</h2>" +
                    "    <p style=\"font-size: 15px; color: #555;\">Chào <b>" + u.getName() + "</b>,</p>" +
                    "    <p style=\"font-size: 15px; color: #555; line-height: 1.6;\">Chúng tôi xin thông báo rằng tài khoản công ty <b>" + company.getName() + "</b> đã bị tạm thời <b style=\"color: #ef4444;\">vô hiệu hóa</b> bởi Quản trị viên của công ty.</p>" +
                    "    " +
                    "    <div style=\"background: #fff5f5; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px;\">" +
                    "        <p style=\"margin: 0; font-size: 14px; color: #c53030;\">" +
                    "            <b>Ảnh hưởng:</b><br/>" +
                    "            • Tất cả các tin tuyển dụng liên quan đã bị ẩn.<br/>" +
                    "            • Các thành viên (không phải Admin) sẽ không thể đăng nhập vào giao diện nhà tuyển dụng.<br/>" +
                    "            • Phiên đăng nhập hiện tại của bạn đã bị hủy." +
                    "        </p>" +
                    "    </div>" +
                    "    " +
                    "    <p style=\"font-size: 14px; color: #666;\">Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ với Quản trị viên công ty của bạn hoặc bộ phận hỗ trợ SkillBridge.</p>" +
                    "    " +
                    "    <div style=\"margin-top: 25px; padding-top: 20px; border-top: 1px solid #eee; font-size: 13px; color: #999;\">" +
                    "        <p style=\"margin: 20px 0 0 0; font-weight: bold; color: #333;\">Trân trọng,<br/>Đội ngũ SkillBridge</p>" +
                    "    </div>" +
                    "</div>";

                try {
                    notificationService.createNotification(
                            u,
                            null,
                            subject,
                            content,
                            "COMPANY_DEACTIVATED",
                            "/",
                            true
                    );

                    Map<String, Object> logoutSignal = Map.of(
                            "action", "FORCE_LOGOUT",
                            "reason", "COMPANY_DEACTIVATED",
                            "companyId", companyId
                    );
                    messagingTemplate.convertAndSend("/topic/user-notifications/" + u.getId(), (Object) logoutSignal);

                    otpService.sendOtpEmail(u.getEmail(), subject, content);
                } catch (Exception e) {
                    System.err.println("Failed to send deactivation email to " + u.getEmail() + ": " + e.getMessage());
                }
            }
        }

        return "Vô hiệu hóa công ty thành công. Tất cả phiên đăng nhập sẽ sớm bị hủy.";
    }

    @Transactional
    public String reactivateCompany(String companyId) {
        CustomUserDetails currentUser = securityUtils.getCurrentUser();

        CompanyMember adminMember = companyMemberRepository.findByCompany_IdAndUser_Id(companyId, currentUser.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_COMPANY_MEMBER));

        if (adminMember.getRole() != CompanyRole.ADMIN) {
            throw new AppException(ErrorCode.NOT_COMPANY_ADMIN);
        }

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new AppException(ErrorCode.COMPANY_NOT_FOUND));

        if (company.getStatus() != CompanyStatus.DEACTIVATED) {
            return "Công ty đang ở trạng thái " + company.getStatus();
        }

        company.setStatus(CompanyStatus.ACTIVE);
        companyRepository.save(company);

        systemLogService.info(currentUser, "KÍCH HOẠT LẠI CÔNG TY: " + company.getName());

        List<CompanyMember> members = companyMemberRepository.findByCompany_Id(companyId);
        String subject = "[SkillBridge] Thông báo kích hoạt lại tài khoản công ty";

        for (CompanyMember member : members) {
            User u = member.getUser();
            if (u == null || u.getEmail() == null) continue;

            String content =
                "<div style=\"font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 20px auto; padding: 30px; border-radius: 12px; background-color: #ffffff; border: 1px solid #e1e4e8; color: #333;\">" +
                "    <h2 style=\"color: #10b981; text-align: center; margin-top: 0;\">Kích hoạt tài khoản</h2>" +
                "    <p style=\"font-size: 15px; color: #555;\">Chào <b>" + u.getName() + "</b>,</p>" +
                "    <p style=\"font-size: 15px; color: #555; line-height: 1.6;\">Chúng tôi vui mừng thông báo rằng tài khoản công ty <b>" + company.getName() + "</b> đã được <b style=\"color: #10b981;\">kích hoạt trở lại</b> bởi Quản trị viên.</p>" +
                "    " +
                "    <div style=\"background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;\">" +
                "        <p style=\"margin: 0; font-size: 14px; color: #15803d;\">" +
                "            <b>Thông tin:<br/>" +
                "            • Bạn hiện đã có thể đăng nhập lại vào hệ thống.<br/>" +
                "            • Các tin tuyển dụng đã được hiển thị công khai trở lại." +
                "        </p>" +
                "    </div>" +
                "    " +
                "    <p style=\"font-size: 14px; color: #666;\">Cảm ơn bạn đã lựa chọn SkillBridge.</p>" +
                "    " +
                "    <div style=\"margin-top: 25px; padding-top: 20px; border-top: 1px solid #eee; font-size: 13px; color: #999;\">" +
                "        <p style=\"margin: 20px 0 0 0; font-weight: bold; color: #333;\">Trân trọng,<br/>Đội ngũ SkillBridge</p>" +
                "    </div>" +
                "</div>";

            try {
                notificationService.createNotification(
                        u,
                        null,
                        subject,
                        content,
                        "COMPANY_REACTIVATED",
                        "/dashboard",
                        true
                );

                Map<String, Object> uiUpdate = Map.of(
                        "action", "COMPANY_REACTIVATED",
                        "companyId", companyId,
                        "companyName", company.getName()
                );
                messagingTemplate.convertAndSend("/topic/user-notifications/" + u.getId(), (Object) uiUpdate);
                otpService.sendOtpEmail(u.getEmail(), subject, content);
            } catch (Exception e) {
                System.err.println("Failed to send reactivation email to " + u.getEmail() + ": " + e.getMessage());
            }
        }

        return "Kích hoạt lại công ty thành công. Các bài đăng tuyển dụng đã được hiển thị lại.";
    }
}
