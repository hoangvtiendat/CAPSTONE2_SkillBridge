package com.skillbridge.backend.service;

import com.skillbridge.backend.dto.request.RespondToApplicationRequest;
import com.skillbridge.backend.entity.*;
import com.skillbridge.backend.enums.ApplicationStatus;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.repository.ApplicationRepository;
import com.skillbridge.backend.repository.CompanyMemberRepository;
import com.skillbridge.backend.repository.JobRepository;
import com.skillbridge.backend.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
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
@Transactional
public class ApplicationService {
    private final ApplicationRepository applicationRepository;
    private final UserService userService;
    private final JobRepository jobRepository;
    private final CompanyMemberRepository companyMemberRepository;
    private final MailService mailService;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationRepository notificationRepository;

    public Application getApplicationById(String id, String jwt) {
        User user = userService.getMe(jwt);
        Application application = applicationRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.APPLICATION_NOT_FOUND));
        Job job = jobRepository.findById(application.getJob().getId()).orElseThrow(() -> new AppException(ErrorCode.APPLICATION_NOT_FOUND));
        System.out.println("job id = " + application.getJob().getId());

        companyMemberRepository.findByCompany_IdAndUser_Id(job.getCompany().getId(), user.getId()).orElseThrow(() -> new AppException(ErrorCode.NOT_COMPANY_MEMBER));
        return application;
    }

    public List<Application> getApplicationByJobId(String jobId, String jwt) {
        User user = userService.getMe(jwt);
        Job job = jobRepository.findById(jobId).orElseThrow(() -> new AppException(ErrorCode.JOB_NOT_FOUND));

        companyMemberRepository.findByCompany_IdAndUser_Id(job.getCompany().getId(), user.getId()).orElseThrow(() -> new AppException(ErrorCode.NOT_COMPANY_MEMBER));

        List<Application> applications = applicationRepository.findByJob_Id(jobId);

        return applications;
    }

    @Transactional(rollbackFor = Exception.class)
    public String respondToApplication(String id, String jwt, RespondToApplicationRequest request) {
        User currentUser = userService.getMe(jwt);

        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.APPLICATION_NOT_FOUND));

        Job job = application.getJob();

        companyMemberRepository.findByCompany_IdAndUser_Id(job.getCompany().getId(), currentUser.getId())
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

        // A. Lưu thông báo vào Database
        Notification notification = Notification.builder()
                .user(candidateUser)
                .title(title)
                .content(messageBody)
                .isRead(false)
                .type("APPLICATION_STATUS")
                .link("/candidate/applications/" + id)
                .build();
        notificationRepository.save(notification);

        // B. Bắn thông báo Real-time (WebSocket)
        try {
            messagingTemplate.convertAndSendToUser(
                    candidateUser.getId(),
                    "/queue/notifications",
                    notification
            );
            log.info("WebSocket sent to user: {}", candidateUser.getId());
        } catch (Exception e) {
            log.error("WebSocket failed: {}", e.getMessage());
        }

        // C. Gửi Email
        try {
            mailService.sendToEmail(candidateUser.getEmail(), title, messageBody);
        } catch (Exception e) {
            log.error("Email failed: {}", e.getMessage());
        }

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
