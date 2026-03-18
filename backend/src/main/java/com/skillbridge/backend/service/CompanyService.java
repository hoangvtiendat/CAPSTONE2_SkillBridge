package com.skillbridge.backend.service;

import com.skillbridge.backend.dto.request.DeactivateRequest;
import com.skillbridge.backend.dto.request.CompanyIdentificationRequest;
import com.skillbridge.backend.dto.CompanyDTO;
import com.skillbridge.backend.dto.response.CompanyFeedItemResponse;
import com.skillbridge.backend.dto.response.CompanyFeedResponse;
import com.skillbridge.backend.dto.response.CompanyMemberResponse;
import com.skillbridge.backend.entity.Company;
import com.skillbridge.backend.entity.CompanyJoinRequest;
import com.skillbridge.backend.entity.CompanyMember;
import com.skillbridge.backend.entity.User;
import com.skillbridge.backend.enums.CompanyRole;
import com.skillbridge.backend.enums.CompanyStatus;
import com.skillbridge.backend.enums.JoinRequestStatus;
import com.skillbridge.backend.enums.SubscriptionPlanStatus;
import com.skillbridge.backend.entity.*;
import com.skillbridge.backend.enums.*;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.transaction.annotation.Transactional;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import com.skillbridge.backend.repository.SubscriptionPlanRepository;
import com.skillbridge.backend.repository.CompanyMemberRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class CompanyService {
    private final String UPLOAD_DIR = "uploads/";
    private final OtpService otpService;

    private final com.skillbridge.backend.repository.CompanyMemberRepository companyMemberRepository;
    private final UserService userService;
    private final CompanyRepository companyRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final CompanyJoinRequestRepository companyJoinRequestRepository;
    private final FileStorageService fileStorageService;
    private final JobRepository jobRepository;
    private final SystemLogRepository systemLogRepository;
    private final com.skillbridge.backend.repository.UserRepository userRepository;

    public CompanyService(
            FileStorageService fileStorageService,
            CompanyRepository companyRepository,
            SubscriptionPlanRepository subscriptionPlanRepository,
            CompanyMemberRepository companyMemberRepository,
            UserService userService,
            CompanyJoinRequestRepository companyJoinRequestRepository,
            JobRepository jobRepository,
            SystemLogRepository systemLogRepository,
            OtpService otpService,
            com.skillbridge.backend.repository.UserRepository userRepository) {
        this.companyRepository = companyRepository;
        this.subscriptionPlanRepository = subscriptionPlanRepository;
        this.companyMemberRepository = companyMemberRepository;
        this.userService = userService;
        this.companyJoinRequestRepository = companyJoinRequestRepository;
        this.jobRepository = jobRepository;
        this.systemLogRepository = systemLogRepository;
        this.otpService = otpService;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
    }

    public Map<String, Object> getCompanies(int page, CompanyStatus status, int limit, String keyword, String categoryId) {
        Pageable pageable = PageRequest.of(page, limit);
        Page<CompanyFeedItemResponse> companyPage;

        if ((keyword != null && !keyword.trim().isEmpty()) || (categoryId != null && !categoryId.trim().isEmpty())) {
            String searchKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
            String searchCategoryId = (categoryId != null && !categoryId.trim().isEmpty()) ? categoryId.trim() : null;
            companyPage = companyRepository.getCompanyFeedSearch(status, searchKeyword, searchCategoryId, pageable);
        } else {
            companyPage = companyRepository.getCompanyFeed(status, pageable);
        }

        return Map.of(
                "companies", companyPage.getContent(),
                "totalPages", companyPage.getTotalPages(),
                "totalElements", companyPage.getTotalElements(),
                "currentPage", companyPage.getNumber()
        );
    }

    public CompanyFeedResponse getCompanyPending(String cursor, int limit){
        try{
            Pageable pageable = PageRequest.of(0,limit+1);

            List<CompanyFeedItemResponse> companies = companyRepository.getCompanyFeedPending(cursor,pageable);

            if(companies.isEmpty()){
                return new CompanyFeedResponse(List.of(), null, false);
            }
            Boolean hasMore = companies.size() > limit;
            List<CompanyFeedItemResponse> result = hasMore ? companies.subList(0,limit):companies;
            String nextCursor = hasMore ? companies.get(limit).getId():null;

            return new CompanyFeedResponse(result, nextCursor,hasMore);
        }catch(Exception e){
            System.out.println("Loi" + e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    public String responseCompanies(String id,String status){
        try{
            Company company = companyRepository.findById(id)
                    .orElseThrow(() -> new AppException(ErrorCode.COMPANY_NOT_FOUND));

            if("ACTIVE".equals(status)){
                company.setStatus(CompanyStatus.ACTIVE);
                System.out.println("Admin đã chấp nhận công ty này");
            }else{
                company.setStatus(CompanyStatus.BAN);
                System.out.println("Admin đã ban công ty này");
            }
            companyRepository.save(company);
            return "Duyệt yêu cầu tạo công ty thành công";
        }catch(Exception e){
            System.out.println("Loi" + e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    public CompanyFeedItemResponse getCompanyDetail(String id) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.COMPANY_NOT_FOUND));

        SubscriptionPlanStatus planName = company.getCurrentSubscriptionPlanName();
        return new CompanyFeedItemResponse(
                company.getId(), company.getName(), company.getTaxId(),
                company.getBusinessLicenseUrl(), company.getImageUrl(),
                company.getDescription(), company.getAddress(),
                company.getWebsiteUrl(), company.getStatus(), planName
        );
    }

    public CompanyDTO lookupByTaxCode(String mst) {
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

            if (searchDoc.location().contains("/company/")) {
                return parseTraTenCongTy(searchDoc, cleanMst);
            }

            Element searchResults = searchDoc.selectFirst(".search-results");
            if (searchResults == null) {
                return null;
            }
            Element firstLink = searchDoc.selectFirst(".search-results a[href*='/company/']");

            if (firstLink != null) {
                String detailUrl = firstLink.absUrl("href");

                Document detailDoc = Jsoup.connect(detailUrl)
                        .userAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36")
                        .get();
                return parseTraTenCongTy(detailDoc, cleanMst);
            }
        } catch (Exception e) {
            System.err.println("!!! LỖI TRONG QUÁ TRÌNH TRA CỨU: " + e.getMessage());
        }
        return null;
    }

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

    public CompanyFeedItemResponse getCompanyByTax(String taxCode) {
        Optional<Company> companyOpt = companyRepository.findCompaniesByTaxId(taxCode);

        if (companyOpt.isPresent()) {
            Company company = companyOpt.get();
            SubscriptionPlanStatus planName = company.getCurrentSubscriptionPlanName();
            return new CompanyFeedItemResponse(company.getId(), company.getName(), company.getTaxId(), company.getBusinessLicenseUrl(), company.getImageUrl(), company.getDescription(), company.getAddress(), company.getWebsiteUrl(), company.getStatus(), planName);
        }
        throw new AppException(ErrorCode.COMPANY_NOT_FOUND);
    }

    public CompanyFeedItemResponse identifyCompany(CompanyIdentificationRequest request,
                                                   MultipartFile logo,
                                                   MultipartFile license) throws IOException {

        // 1. Kiểm tra tồn tại qua Tax Code
        Optional<Company> companyOpt = companyRepository.findCompaniesByTaxId(request.getTaxcode());
        if (companyOpt.isPresent()) {
            throw new AppException(ErrorCode.COMPANY_EXIST);
        }

        // 2. Xử lý lưu File
        String logoUrl = fileStorageService.saveFile(logo, "logos");
        String licenseUrl = fileStorageService.saveFile(license, "licenses");

        // 3. Lưu vào Database
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

        SubscriptionPlanStatus planName = company.getCurrentSubscriptionPlanName();
        return new CompanyFeedItemResponse(
                company.getId(), company.getName(), company.getTaxId(),
                company.getBusinessLicenseUrl(), company.getImageUrl(),
                company.getDescription(), company.getAddress(),
                company.getWebsiteUrl(), company.getStatus(), planName
        );
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


        List<CompanyMember> admins = companyMemberRepository.findByCompany_IdAndRole(companyId, CompanyRole.ADMIN);

        if (admins.isEmpty()) {
            throw new AppException(ErrorCode.HAS_NO_ADMIN);
        }

        CompanyJoinRequest joinRequest = CompanyJoinRequest.builder().company(company).user(user).status(JoinRequestStatus.PENDING).build();
        companyJoinRequestRepository.save(joinRequest);

        String subject = "[SkillBridge] Yêu cầu tham gia công ty";

        for (CompanyMember adminMember : admins) {

            User admin = adminMember.getUser();
            String adminEmail = admin.getEmail();

            String content = "<div style=\"font-family: Arial; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;\">" + "<h2 style=\"color:#1a73e8\">Yêu cầu tham gia công ty</h2>" + "<p>Xin chào,</p>" + "<p><b>" + user.getName() + "</b> đã gửi yêu cầu tham gia công ty của bạn.</p>" + "<p>Email người gửi: " + user.getEmail() + "</p>" + "<p>Vui lòng đăng nhập hệ thống để phê duyệt hoặc từ chối yêu cầu này.</p>" + "<br>" + "<p style=\"font-size:12px;color:#888\">Trân trọng,<br>SkillBridge Team</p>" + "</div>";

            otpService.sendOtpEmail(adminEmail, subject, content);
        }

        return "Yêu cầu tham gia đã được gửi đến admin công ty";
    }
    //ADmin công ty duyệt thành viên vào công ty
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

    @Transactional
    public String deactivateCompany(String companyId, DeactivateRequest request, String token) {
        User currentUser = userService.getMe(token);

        // 1. Kiểm tra Permission (Phải là Admin của công ty)
        CompanyMember adminMember = companyMemberRepository.findByCompany_IdAndUser_Id(companyId, currentUser.getId())
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
        jobRepository.updateStatusByCompanyId(companyId, JobStatus.HIDDEN);

        // 5. Audit Log
        SystemLog log = new SystemLog();
        log.setUser(currentUser);
        log.setAction("DEACTIVATE_COMPANY: " + company.getName());
        log.setLogLevel(LogLevel.INFO);
        systemLogRepository.save(log);

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
                    otpService.sendOtpEmail(u.getEmail(), subject, content);
                } catch (Exception e) {
                    System.err.println("Failed to send deactivation email to " + u.getEmail() + ": " + e.getMessage());
                }
            }
        }

        return "Vô hiệu hóa công ty thành công. Tất cả phiên đăng nhập sẽ sớm bị hủy.";
    }

    @Transactional
    public String reactivateCompany(String companyId, String token) {
        User currentUser = userService.getMe(token);

        CompanyMember adminMember = companyMemberRepository.findByCompany_IdAndUser_Id(companyId, currentUser.getId())
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

        // US09: Tự động mở lại các Jobs đã bị ẩn khi vô hiệu hóa
        jobRepository.updateStatusByCompanyIdAndCurrentStatus(companyId, JobStatus.HIDDEN, JobStatus.OPEN);

        // Gửi thông báo kích hoạt lại cho các thành viên
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
                otpService.sendOtpEmail(u.getEmail(), subject, content);
            } catch (Exception e) {
                System.err.println("Failed to send reactivation email to " + u.getEmail() + ": " + e.getMessage());
            }
        }

        SystemLog log = new SystemLog();
        log.setUser(currentUser);
        log.setAction("REACTIVATE_COMPANY: " + company.getName());
        log.setLogLevel(LogLevel.INFO);
        systemLogRepository.save(log);

        return "Kích hoạt lại công ty thành công. Các bài đăng tuyển dụng đã được hiển thị lại.";
    }
}
