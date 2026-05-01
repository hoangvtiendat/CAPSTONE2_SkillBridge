package com.skillbridge.backend.service;

import com.skillbridge.backend.config.CustomUserDetails;
import com.skillbridge.backend.dto.request.RespondToApplicationRequest;
import com.skillbridge.backend.entity.Application;
import com.skillbridge.backend.entity.Job;
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

        List<Application> applications = applicationRepository.findByJob_Id(jobId);

        return applications;
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

        applicationRepository.delete(application);
    }

    @Transactional(rollbackFor = Exception.class)
    public String respondToApplication(String id, RespondToApplicationRequest request) {
        CustomUserDetails currentUser = securityUtils.getCurrentUser();

        String DEFAULT_REASON = "Nhà tuyển dụng không đưa ra lý do cụ thể.";
        String reason = DEFAULT_REASON;

        if (request != null && request.getReason() != null && !request.getReason().trim().isEmpty()) {
            reason = request.getReason();
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
}
