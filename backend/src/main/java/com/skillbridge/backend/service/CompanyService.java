package com.skillbridge.backend.service;

import com.skillbridge.backend.dto.request.CompanyIdentificationRequest;
import com.skillbridge.backend.dto.CompanyDTO;
import com.skillbridge.backend.dto.response.CompanyFeedItemResponse;
import com.skillbridge.backend.dto.response.CompanyFeedResponse;
import com.skillbridge.backend.entity.Company;
import com.skillbridge.backend.entity.CompanyJoinRequest;
import com.skillbridge.backend.entity.CompanyMember;
import com.skillbridge.backend.entity.User;
import com.skillbridge.backend.enums.CompanyRole;
import com.skillbridge.backend.enums.CompanyStatus;
import com.skillbridge.backend.enums.JoinRequestStatus;
import com.skillbridge.backend.enums.SubscriptionPlanStatus;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.repository.CompanyJoinRequestRepository;
import com.skillbridge.backend.repository.CompanyRepository;
import org.springframework.data.domain.Page;
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
    @Autowired
    private OtpService otpService;

    private final com.skillbridge.backend.repository.CompanyMemberRepository companyMemberRepository;
    private final UserService userService;
    private final CompanyRepository companyRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final CompanyJoinRequestRepository companyJoinRequestRepository;

    public CompanyService(CompanyRepository companyRepository, SubscriptionPlanRepository subscriptionPlanRepository, CompanyMemberRepository companyMemberRepository, UserService userService, CompanyJoinRequestRepository companyJoinRequestRepository) {
        this.companyRepository = companyRepository;
        this.subscriptionPlanRepository = subscriptionPlanRepository;
        this.companyMemberRepository = companyMemberRepository;
        this.userService = userService;
        this.companyJoinRequestRepository = companyJoinRequestRepository;
    }

    public Map<String, Object> getCompanies(int page, CompanyStatus status, int limit) {
        Pageable pageable = PageRequest.of(page, limit);
        Page<CompanyFeedItemResponse> companyPage = companyRepository.getCompanyFeed(status, pageable);

        return Map.of(
                "companies", companyPage.getContent(),
                "totalPages", companyPage.getTotalPages(),
                "totalElements", companyPage.getTotalElements(),
                "currentPage", companyPage.getNumber()
        );
    }

    public CompanyDTO lookupByTaxCode(String mst) {
        String cleanMst = mst.trim();
        System.out.println("\n" + "=".repeat(50));
        System.out.println("BẮT ĐẦU KIỂM TRA MST: [" + cleanMst + "]");
        System.out.println("===========================================");

        try {
            String searchUrl = "https://www.tratencongty.com/search/" + cleanMst;
            System.out.println("-> Đang gửi POST request tới: " + searchUrl);

            Document searchDoc = Jsoup.connect(searchUrl)
                    .userAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36")
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .data("q", cleanMst) // 'q' là name của input trong image_342b92.png
                    .method(org.jsoup.Connection.Method.POST)
                    .timeout(15000)
                    .followRedirects(true)
                    .post();

            System.out.println("-> Tiêu đề trang sau POST: " + searchDoc.title());
            System.out.println("-> URL thực tế: " + searchDoc.location());

            if (searchDoc.location().contains("/company/")) {
                System.out.println("=> TRÌNH DUYỆT TỰ REDIRECT THẲNG VÀO TRANG CHI TIẾT.");
                return parseTraTenCongTy(searchDoc, cleanMst);
            }

            Element searchResults = searchDoc.selectFirst(".search-results");
            if (searchResults == null) {
                System.out.println("!!! KHÔNG THẤY KHỐI .search-results");
                String bodyText = searchDoc.body().text();
                System.out.println("-> Nội dung Body (snippet): " + (bodyText.length() > 300 ? bodyText.substring(0, 300) : bodyText));
                return null;
            }
            Element firstLink = searchDoc.selectFirst(".search-results a[href*='/company/']");

            if (firstLink != null) {
                String detailUrl = firstLink.absUrl("href");
                System.out.println("=> LẤY KẾT QUẢ ĐẦU TIÊN: " + detailUrl);

                Document detailDoc = Jsoup.connect(detailUrl)
                        .userAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36")
                        .get();
                return parseTraTenCongTy(detailDoc, cleanMst);
            } else {
                System.out.println("!!! KHÔNG TÌM THẤY BẤT KỲ KẾT QUẢ NÀO TRÊN TRANG.");
                String bodySnippet = searchDoc.body().text();
                System.out.println("-> Nội dung hiển thị: " + (bodySnippet.length() > 200 ? bodySnippet.substring(0, 200) : bodySnippet));
            }
        } catch (Exception e) {
            System.err.println("!!! LỖI TRONG QUÁ TRÌNH TRA CỨU: " + e.getMessage());
        }
        System.out.println("=".repeat(50) + "\n");
        return null;
    }

    private CompanyDTO parseTraTenCongTy(Document doc, String mst) {
        System.out.println("-> Bắt đầu bóc tách dữ liệu chính xác...");
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
                System.out.println("Đã trích xuất ảnh SĐT");
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
        System.out.println("Tên Công ty: " + dto.getName());
        System.out.println("Địa chỉ: " + dto.getAddress());
        System.out.println("Đại diện: " + dto.getRepresentative());
        System.out.println("Ngày cấp giấy phép: " + dto.getLicenseDate());
        System.out.println("Ngày hoạt động: " + dto.getStartDate());
        System.out.println("Trạng thái: " + dto.getStatus());

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
        String logoUrl = saveFile(logo, "logos");
        String licenseUrl = saveFile(license, "licenses");

        // 3. Lưu vào Database
        Company company = new Company();
        company.setName(request.getName());
        company.setTaxId(request.getTaxcode());
        company.setBusinessLicenseUrl(licenseUrl); // Lưu path/url
        company.setImageUrl(logoUrl);              // Lưu path/url
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

    // Helper: Hàm lưu file vào ổ đĩa
    private String saveFile(MultipartFile file, String subFolder) throws IOException {
        if (file == null || file.isEmpty()) return null;

        Path uploadPath = Paths.get(UPLOAD_DIR + subFolder);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Tạo tên file duy nhất để tránh trùng lặp
        String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        // Trả về đường dẫn để lưu vào DB (Sau này có thể là URL của Cloudinary)
        return "/" + subFolder + "/" + fileName;
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
