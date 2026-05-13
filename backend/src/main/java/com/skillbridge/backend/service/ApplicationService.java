package com.skillbridge.backend.service;

import com.skillbridge.backend.config.CustomUserDetails;
import com.skillbridge.backend.dto.request.RespondToApplicationRequest;
import com.skillbridge.backend.dto.response.CandidateComparisonAdviceResponse;
import com.skillbridge.backend.entity.Application;
import com.skillbridge.backend.entity.Job;
import com.skillbridge.backend.entity.JobSkill;
import com.skillbridge.backend.entity.User;
import com.skillbridge.backend.enums.ApplicationStatus;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.repository.ApplicationRepository;
import com.skillbridge.backend.repository.CompanyMemberRepository;
import com.skillbridge.backend.repository.JobRepository;
import com.skillbridge.backend.utils.SecurityUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;


@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ApplicationService {
    ApplicationRepository applicationRepository;
    JobRepository jobRepository;
    CompanyMemberRepository companyMemberRepository;
    NotificationService notificationService;
    SecurityUtils securityUtils;
    GeminiService geminiService;

    public Application getApplicationById(String id, String jwt) {
        CustomUserDetails currentUser = securityUtils.getCurrentUser();

        Application application = applicationRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.APPLICATION_NOT_FOUND));
        Job job = jobRepository.findById(application.getJob().getId()).orElseThrow(() -> new AppException(ErrorCode.APPLICATION_NOT_FOUND));
        System.out.println("job id = " + application.getJob().getId());

        companyMemberRepository.findByCompany_IdAndUser_Id(job.getCompany().getId(), currentUser.getUserId()).orElseThrow(() -> new AppException(ErrorCode.NOT_COMPANY_MEMBER));
        return application;
    }

    public List<Application> getApplicationByJobId(String jobId) {
        CustomUserDetails currentUser = securityUtils.getCurrentUser();

        Job job = jobRepository.findById(jobId).orElseThrow(() -> new AppException(ErrorCode.JOB_NOT_FOUND));

        companyMemberRepository.findByCompany_IdAndUser_Id(job.getCompany().getId(), currentUser.getUserId()).orElseThrow(() -> new AppException(ErrorCode.NOT_COMPANY_MEMBER));

        return applicationRepository.findByJob_Id(jobId);
    }

    public List<Application> getApplicationsByCompanyId(String companyId) {
        CustomUserDetails currentUser = securityUtils.getCurrentUser();

        // Verify user is member of the company
        companyMemberRepository.findByCompany_IdAndUser_Id(companyId, currentUser.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_COMPANY_MEMBER));

        return applicationRepository.findByJob_Company_Id(companyId);
    }

    @Transactional(rollbackFor = Exception.class)
    public void deleteApplication(String id) {
        CustomUserDetails currentUser = securityUtils.getCurrentUser();
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.APPLICATION_NOT_FOUND));

        // Verify recruiter belongs to the company that owns the job
        companyMemberRepository.findByCompany_IdAndUser_Id(application.getJob().getCompany().getId(), currentUser.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_COMPANY_MEMBER));

        // Enforce business rule: Only allowed to delete if status is REJECTED
        if (application.getStatus() != ApplicationStatus.REJECTED) {
            throw new AppException(ErrorCode.CANNOT_DELETE_ACTIVE_APPLICATION);
        }

        applicationRepository.delete(application);
    }

    @Transactional(rollbackFor = Exception.class)
    public String respondToApplication(String id, RespondToApplicationRequest request) {
        CustomUserDetails currentUser = securityUtils.getCurrentUser();

        String DEFAULT_REASON = "Nhà tuyển dụng không có ghi chú gì cho ứng viên.";
        String reason = DEFAULT_REASON;

        if (request != null && request.getNote() != null && !request.getNote().trim().isEmpty()) {
            reason = request.getNote();
        }

        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.APPLICATION_NOT_FOUND));

        Job job = application.getJob();

        companyMemberRepository.findByCompany_IdAndUser_Id(job.getCompany().getId(), currentUser.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_COMPANY_MEMBER));

        ApplicationStatus newStatus;
        try {
            newStatus = ApplicationStatus.valueOf(request.getStatus().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new AppException(ErrorCode.INVALID_STATUS);
        }
        application.setStatus(newStatus);
        application.setNote(reason);
        applicationRepository.save(application);

        // --- XỬ LÝ CHUẨN HÓA NỘI DUNG THÔNG BÁO ---
        User candidateUser = application.getCandidate().getUser();
        String companyName = job.getCompany().getName();

        // 2. Lấy tiêu đề Job sạch (Xử lý đa ngôn ngữ)
        Map<String, Object> jobTitleMap = job.getTitle();

        // 3. Tạo tiêu đề và nội dung thân thiện
        String jobDisplayName = JobService.getJobPositionName(job);
        String title = "Cập nhật từ SkillBridge: " + jobDisplayName;

        // Chuyển Enum status sang tiếng Việt cho thân thiện (Tùy chọn)
        String statusVi = translateStatus(newStatus);
        String messageBody = "";
        if (request.getStatus().equals("REJECTED")) {
            messageBody = String.format(
                    "Chào %s,\n\nCông ty %s đã cập nhật trạng thái hồ sơ của bạn cho vị trí %s thành: %s.\n" +
                            "Lý do từ chối: %s\nVui lòng truy cập hệ thống để xem chi tiết.",
                    application.getFullName(), companyName, jobDisplayName, statusVi, reason
            );
        } else if (request.getStatus().equals("INTERVIEW")) {
            messageBody = String.format(
                    "Chào %s,\n\nCông ty %s đã cập nhật trạng thái hồ sơ của bạn cho vị trí %s thành: %s.\n" +
                            "Vui lòng truy cập hệ thống để xem chi tiết.",
                    application.getFullName(), companyName, jobDisplayName, statusVi
            );
        }


        // --- THỰC HIỆN LUỒNG THÔNG BÁO ---

        notificationService.createNotification(
                candidateUser,
                currentUser.getEmail(),
                title,
                messageBody,
                "APPLICATION_STATUS",
                "my-applied-jobs",
                true
        );
        return "Phản hồi ứng viên thành công!";
    }

    private String translateStatus(ApplicationStatus status) {
        return switch (status) {
            case PENDING -> "Đang chờ duyệt";
            case INTERVIEW -> "Mời phỏng vấn";
            case HIRED -> "Đã thuê";
            case REJECTED -> "Từ chối hồ sơ";
            case TALENT_POOL -> "Kho ứng viên tiềm năng";
            default -> status.toString();
        };
    }

    @Transactional(rollbackFor = Exception.class)
    public String withDrawApplication(String id, String withdrawReason) {
        CustomUserDetails currentUser = securityUtils.getCurrentUser();
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.APPLICATION_NOT_FOUND));

        if (!application.getCandidate().getId().equals(currentUser.getUserId())) {
            throw new AppException(ErrorCode.NOT_MY_APPLICATION);
        }

        Job job = application.getJob();
        String companyId = job.getCompany().getId();
        String jobDisplayName = JobService.getJobPositionName(job);

        // --- 1. XỬ LÝ THÔNG BÁO CHO NHÀ TUYỂN DỤNG ---
        String title = "Ứng viên rút hồ sơ: " + jobDisplayName;
        String messageBody = String.format(
                "Chào bộ phận tuyển dụng,\n\nỨng viên %s vừa rút đơn ứng tuyển cho vị trí %s.\nLý do: %s",
                application.getFullName(), jobDisplayName, withdrawReason
        );

        // Lấy danh sách các thành viên (HR/Nhà tuyển dụng) của công ty để gửi thông báo
        // Giả định bạn có hàm findByCompany_Id trong CompanyMemberRepository trả về List<CompanyMember>
        var companyMembers = companyMemberRepository.findByCompany_Id(companyId);

        if (companyMembers != null && !companyMembers.isEmpty()) {
            for (var member : companyMembers) {
                notificationService.createNotification(
                        member.getUser(),
                        currentUser.getEmail(),
                        title,
                        messageBody,
                        "APPLICATION_WITHDRAWN",
                        "/recruiter/jobs/" + job.getId() + "/applications",
                        true
                );
            }
        }

        // --- 2. XÓA HỒ SƠ ---
        applicationRepository.deleteById(id);

        return "Rút hồ sơ ứng tuyển thành công";
    }

    /**
     * So sánh hai hồ sơ ứng tuyển cùng một tin tuyển dụng; gọi Gemini để tư vấn phù hợp hơn.
     */
    public CandidateComparisonAdviceResponse compareTwoApplicationsForJob(
            String jobId,
            String applicationIdA,
            String applicationIdB
    ) {
        if (applicationIdA.equals(applicationIdB)) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }

        CustomUserDetails currentUser = securityUtils.getCurrentUser();
        Job job = jobRepository.findById(jobId).orElseThrow(() -> new AppException(ErrorCode.JOB_NOT_FOUND));
        companyMemberRepository.findByCompany_IdAndUser_Id(job.getCompany().getId(), currentUser.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_COMPANY_MEMBER));

        Application appA = applicationRepository.findWithJobContextById(applicationIdA)
                .orElseThrow(() -> new AppException(ErrorCode.APPLICATION_NOT_FOUND));
        Application appB = applicationRepository.findWithJobContextById(applicationIdB)
                .orElseThrow(() -> new AppException(ErrorCode.APPLICATION_NOT_FOUND));

        if (!appA.getJob().getId().equals(jobId) || !appB.getJob().getId().equals(jobId)) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }

        String prompt = buildCandidateComparisonPrompt(job, applicationIdA, appA, applicationIdB, appB);
        return geminiService.callGemini(prompt, CandidateComparisonAdviceResponse.class);
    }

    private static String truncate(String value, int maxChars) {
        if (value == null || value.isBlank()) {
            return "";
        }
        String trimmed = value.trim();
        if (trimmed.length() <= maxChars) {
            return trimmed;
        }
        return trimmed.substring(0, maxChars) + "\n...[đã cắt bớt nội dung dài]";
    }

    private String formatJobSkills(Job job) {
        if (job.getJobSkills() == null || job.getJobSkills().isEmpty()) {
            return "(Không có danh sách kỹ năng gắn với tin tuyển dụng)";
        }
        return job.getJobSkills().stream()
                .map(JobSkill::getSkill)
                .filter(s -> s != null && s.getName() != null)
                .map(s -> "- " + s.getName())
                .collect(Collectors.joining("\n"));
    }

    private String buildCandidateComparisonPrompt(
            Job job,
            String applicationIdA,
            Application appA,
            String applicationIdB,
            Application appB
    ) {
        String jobTitle = JobService.getJobPositionName(job);
        String skillsBlock = formatJobSkills(job);
        String jobDescription = truncate(job.getDescription(), 8000);

        return """
                Bạn là chuyên gia tuyển dụng. Nhiệm vụ: so sánh hai ứng viên cho CÙNG một vị trí và đưa ra lời khuyên khách quan, dựa trên dữ liệu dưới đây (bao gồm điểm AI và phân tích nếu có).
                Với mỗi ứng viên, hãy liệt kê điểm mạnh (firstCandidateHighlights / secondCandidateHighlights) VÀ điểm yếu / rủi ro / khoảng trống so với mô tả tin tuyển dụng (firstCandidateWeaknesses / secondCandidateWeaknesses). Điểm yếu phải mang tính xây dựng, dựa trên dữ liệu có sẵn, tránh phán xét cá nhân không có căn cứ.
                Trả lời bằng tiếng Việt trong các trường văn bản. betterFit CHỈ được là một trong ba giá trị chính xác: FIRST, SECOND, EQUAL.
                - FIRST: ứng viên tương ứng khối "ỨNG VIÊN THỨ NHẤT" (applicationIdA) phù hợp hơn với tin tuyển dụng.
                - SECOND: ứng viên "ỨNG VIÊN THỨ HAI" (applicationIdB) phù hợp hơn.
                - EQUAL: hai ứng viên tương đương hoặc không đủ cơ sở để xếp hạng rõ ràng.

                Chỉ trả về MỘT đối tượng JSON hợp lệ, không markdown, không giải thích ngoài JSON. Cấu trúc JSON:
                {
                  "betterFit": "FIRST|SECOND|EQUAL",
                  "headline": "string",
                  "comparisonSummary": "string",
                  "firstCandidateHighlights": ["string"],
                  "secondCandidateHighlights": ["string"],
                  "firstCandidateWeaknesses": ["string"],
                  "secondCandidateWeaknesses": ["string"],
                  "hiringRecommendation": "string"
                }

                --- TIN TUYỂN DỤNG ---
                ID tin: %s
                Tiêu đề / vị trí: %s
                Mô tả (có thể rút gọn):
                %s

                Kỹ năng yêu cầu (từ hệ thống):
                %s

                --- ỨNG VIÊN THỨ NHẤT (applicationIdA = %s) ---
                Họ tên: %s
                Email: %s
                Điện thoại: %s
                Trạng thái hồ sơ: %s
                Điểm AI matching (0-100, có thể null): %s
                Phân tích AI (nếu có): %s
                Ghi chú ứng viên/NĐT: %s
                Thư giới thiệu (rút gọn nếu dài): %s
                qualifications (JSON/text, rút gọn): %s
                parsedContentJson (rút gọn): %s

                --- ỨNG VIÊN THỨ HAI (applicationIdB = %s) ---
                Họ tên: %s
                Email: %s
                Điện thoại: %s
                Trạng thái hồ sơ: %s
                Điểm AI matching (0-100, có thể null): %s
                Phân tích AI (nếu có): %s
                Ghi chú ứng viên/NĐT: %s
                Thư giới thiệu (rút gọn nếu dài): %s
                qualifications (JSON/text, rút gọn): %s
                parsedContentJson (rút gọn): %s
                """.formatted(
                job.getId(),
                jobTitle,
                jobDescription,
                skillsBlock,
                applicationIdA,
                appA.getFullName(),
                appA.getEmail(),
                appA.getPhoneNumber(),
                appA.getStatus(),
                appA.getAiMatchingScore(),
                truncate(appA.getAiAnalysis(), 4000),
                truncate(appA.getNote(), 1500),
                truncate(appA.getRecommendationLetter(), 3000),
                truncate(appA.getQualifications(), 4000),
                truncate(appA.getParsedContentJson(), 6000),
                applicationIdB,
                appB.getFullName(),
                appB.getEmail(),
                appB.getPhoneNumber(),
                appB.getStatus(),
                appB.getAiMatchingScore(),
                truncate(appB.getAiAnalysis(), 4000),
                truncate(appB.getNote(), 1500),
                truncate(appB.getRecommendationLetter(), 3000),
                truncate(appB.getQualifications(), 4000),
                truncate(appB.getParsedContentJson(), 6000)
        );
    }
}
