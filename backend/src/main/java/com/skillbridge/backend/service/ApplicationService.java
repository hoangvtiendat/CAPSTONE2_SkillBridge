package com.skillbridge.backend.service;

import com.skillbridge.backend.config.CustomUserDetails;
import com.skillbridge.backend.dto.request.RespondToApplicationRequest;
import com.skillbridge.backend.entity.*;
import com.skillbridge.backend.enums.ApplicationStatus;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.repository.ApplicationRepository;
import com.skillbridge.backend.repository.CompanyMemberRepository;
import com.skillbridge.backend.repository.JobRepository;
import com.skillbridge.backend.repository.NotificationRepository;
import com.skillbridge.backend.utils.SecurityUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.messaging.simp.SimpMessagingTemplate;

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

    public List<Application> getApplicationByJobId(String jobId, String jwt) {
        CustomUserDetails currentUser = securityUtils.getCurrentUser();

        Job job = jobRepository.findById(jobId).orElseThrow(() -> new AppException(ErrorCode.JOB_NOT_FOUND));

        companyMemberRepository.findByCompany_IdAndUser_Id(job.getCompany().getId(), currentUser.getUserId()).orElseThrow(() -> new AppException(ErrorCode.NOT_COMPANY_MEMBER));

        List<Application> applications = applicationRepository.findByJob_Id(jobId);

        return applications;
    }

    @Transactional(rollbackFor = Exception.class)
    public String respondToApplication(String id, String jwt, RespondToApplicationRequest request) {
        CustomUserDetails currentUser = securityUtils.getCurrentUser();

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
        String cleanJobTitle = jobTitleMap.getOrDefault("vi", jobTitleMap.getOrDefault("en", "N/A")).toString();

        // 3. Tạo tiêu đề và nội dung thân thiện
        String title = "Cập nhật từ SkillBridge: " + cleanJobTitle;

        // Chuyển Enum status sang tiếng Việt cho thân thiện (Tùy chọn)
        String statusVi = translateStatus(newStatus);

        String messageBody = String.format(
                "Chào %s,\n\nCông ty %s đã cập nhật trạng thái hồ sơ của bạn cho vị trí %s thành: %s.\n" +
                        "Vui lòng truy cập hệ thống để xem chi tiết.",
                application.getFullName(), companyName, cleanJobTitle, statusVi
        );

        // --- THỰC HIỆN LUỒNG THÔNG BÁO ---

        notificationService.createNotification(
                candidateUser,
                currentUser.getEmail(),
                title,
                messageBody,
                "APPLICATION_STATUS",
                "/candidate/applications/" + id,
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
            default -> status.toString();
        };
    }
}
