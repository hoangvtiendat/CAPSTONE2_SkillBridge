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
            System.out.println(request.getStatus().toUpperCase());
            newStatus = ApplicationStatus.valueOf(request.getStatus().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new AppException(ErrorCode.INVALID_STATUS);
        }
        application.setStatus(newStatus);
        applicationRepository.save(application);

        User candidateUser = application.getCandidate().getUser();
        String companyName = job.getCompany().getName();
        Map<String, Object> jobTitle = job.getTitle();
        String title = "Cập nhật từ SkillBridge: " + jobTitle;

        String messageBody = String.format(
                "Chào %s,\n\nCông ty %s đã cập nhật trạng thái hồ sơ của bạn cho vị trí %s thành: %s.\n" +
                        "Vui lòng truy cập hệ thống để xem chi tiết.",
                application.getFullName(), companyName, jobTitle, newStatus
        );

        // --- THỰC HIỆN LUỒNG THÔNG BÁO ---

        // A. Lưu thông báo vào Database (Để xem lại sau này)
        Notification notification = Notification.builder()
                .user(candidateUser)
                .title(title)
                .content(messageBody)
                .isRead(false)
                .type("APPLICATION_STATUS")
                .link("/candidate/applications/" + id) // Link để FE điều hướng
                .build();
        notificationRepository.save(notification);

        // B. Bắn thông báo Real-time (WebSocket)
        try {
            // Gửi đến endpoint: /user/{candidateId}/queue/notifications
            messagingTemplate.convertAndSendToUser(
                    candidateUser.getId(),
                    "/queue/notifications",
                    notification
            );
            log.info("Đã bắn WebSocket cho user: {}", candidateUser.getId());
        } catch (Exception e) {
            log.error("Lỗi WebSocket (vẫn tiếp tục): {}", e.getMessage());
        }

        // C. Gửi Email (Sử dụng MailServiceImpl của ông)
        try {
            // Nên chạy @Async trong MailServiceImpl để không làm chậm request này
            mailService.sendToEmail(candidateUser.getEmail(), title, messageBody);
            log.info("Đã gửi email thông báo cho: {}", candidateUser.getEmail());
        } catch (Exception e) {
            log.error("Lỗi gửi Email (vẫn tiếp tục): {}", e.getMessage());
        }

        return "Phản hồi ứng viên thành công!";
    }
}
