package com.skillbridge.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillbridge.backend.config.CustomUserDetails;
import com.skillbridge.backend.dto.request.CreateJobRequest;
import com.skillbridge.backend.dto.request.JobApplicationRequest;
import com.skillbridge.backend.dto.request.JobSkillRequest;
import com.skillbridge.backend.dto.response.*;
import com.skillbridge.backend.entity.*;
import com.skillbridge.backend.enums.*;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.repository.*;
import com.skillbridge.backend.service.AI_Service_File.AIJobService;
import com.skillbridge.backend.utils.SecurityUtils;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class JobService {
    String UPLOAD_DIR = "uploads/";
    JobRepository jobRepository;
    SystemLogService logsService;
    CategoryRepository categoryRepository;
    SkillRepository skillRepository;
    JobSkillRepository jobSkillRepository;
    CompanyMemberRepository companyMemberRepository;
    EmbeddingService embeddingService;
    CompanyRepository companyRepository;
    SecurityUtils securityUtils;
    CandidateRepository candidateRepository;
    ApplicationRepository applicationRepository;
    ObjectMapper objectMapper;
    FileStorageService fileStorageService;
    NotificationRepository notificationRepository;
    NotificationService notificationService;
    SimpMessagingTemplate messagingTemplate;
    SubscriptionOfCompanyRepository subscriptionOfCompanyRepository;
    CVJobEvaluationRepository cvJobEvaluationRepository;
    ApplicationMatchScoringService applicationMatchScoringService;
    AIJobService aiJobService;
    MailServiceImpl mailService;
    provincesRepository provincesRepository;
    JobInvitationRepository jobInvitationRepository;

    LocalDate date = LocalDate.now();

    @NonFinal
    @Value("${mail.username}")
    String senderEmail;

    public Map<String, Object> getJobFeed(int page, int limit, String categoryId, String location, Double salary) {
        Pageable pageable = PageRequest.of(page, limit);

        Page<JobFeedItemResponse> jobPage = jobRepository.getJobFeedFiltered(
                JobStatus.OPEN, categoryId, location, salary, pageable
        );

        if (jobPage.isEmpty()) {
            return Map.of(
                    "jobs", List.of(),
                    "totalPages", 0,
                    "totalElements", 0,
                    "currentPage", page
            );
        }

        List<JobFeedItemResponse> jobList = jobPage.getContent();
        enrichSkills(jobList);

        return Map.of(
                "jobs", jobList,
                "totalPages", jobPage.getTotalPages(),
                "totalElements", jobPage.getTotalElements(),
                "currentPage", jobPage.getNumber()
        );
    }

    public Map<String, Object> getJobsByCompany(String companyId, int page, int limit, List<String> categoryIds) {
        Pageable pageable = PageRequest.of(page, limit);

        List<String> validCategoryIds = (categoryIds != null && !categoryIds.isEmpty()) ? categoryIds : null;

        Page<JobFeedItemResponse> jobPage = jobRepository.findJobsByCompanyIdWithPagination(
                companyId, JobStatus.OPEN, validCategoryIds, pageable
        );

        if (jobPage.isEmpty()) {
            return Map.of(
                    "jobs", List.of(),
                    "totalPages", 0,
                    "totalElements", 0,
                    "currentPage", page
            );
        }

        List<JobFeedItemResponse> resultList = jobPage.getContent();

        List<String> jobIds = resultList.stream()
                .map(JobFeedItemResponse::getJobId)
                .toList();

        List<Object[]> skillData = jobRepository.findSkillNamesByJobIds(jobIds);

        Map<String, List<String>> skillsMap = skillData.stream()
                .collect(Collectors.groupingBy(
                        obj -> (String) obj[0],
                        Collectors.mapping(obj -> (String) obj[1], Collectors.toList())
                ));

        resultList.forEach(item ->
                item.setSkills(skillsMap.getOrDefault(item.getJobId(), List.of()))
        );

        return Map.of(
                "jobs", resultList,
                "totalPages", jobPage.getTotalPages(),
                "totalElements", jobPage.getTotalElements(),
                "currentPage", jobPage.getNumber()
        );
    }

    public AdminJobFeedResponse adminGetJob(int page, int limit, String status, String modStatus) {
        try {
            JobStatus newStatus = null;
            if (status != null && !status.isEmpty()) {
                try {
                    newStatus = JobStatus.valueOf(status.toUpperCase());
                } catch (IllegalArgumentException e) {
                    System.out.println("Lưu ý: JobStatus sai định dạng [" + status + "]");
                }
            }
            ModerationStatus newModStatus = null;
            if (modStatus != null && !modStatus.isEmpty()) {
                try {
                    newModStatus = ModerationStatus.valueOf(modStatus.toUpperCase());
                } catch (IllegalArgumentException e) {
                    System.out.println("Lưu ý: ModerationStatus sai định dạng [" + modStatus + "]");
                }
            }
            Pageable pageable = PageRequest.of(page, limit);
            Page<AdminJobFeedItemResponse> jobs = jobRepository.adminGetJobs(newStatus, newModStatus, pageable);
            if (jobs.isEmpty()) {
                return new AdminJobFeedResponse(List.of(), 0, 0, page);
            }
            List<AdminJobFeedItemResponse> resultList = jobs.getContent();
            enrichSkills((List<JobFeedItemResponse>) (List<?>) resultList);

            return new AdminJobFeedResponse(resultList, jobs.getTotalPages(), jobs.getTotalElements(), jobs.getNumber());
        } catch (Exception e) {
            System.err.println("Lỗi khi admin lấy danh sách job: " + e.getMessage());
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    public AdminJobFeedResponse adminGetJobPending(int page, int limit, String modStatus) {
        try {
            ModerationStatus newModStatus = null;
            if (modStatus != null && !modStatus.isEmpty()) {
                try {
                    newModStatus = ModerationStatus.valueOf(modStatus.toUpperCase());
                } catch (IllegalArgumentException e) {
                    System.out.println("Lưu ý: ModerationStatus sai định dạng [" + modStatus + "]");
                }
            }
            Pageable pageable = PageRequest.of(page, limit);
            Page<AdminJobFeedItemResponse> jobs = jobRepository.adminGetJobPending(newModStatus, pageable);
            if (jobs.isEmpty()) {
                return new AdminJobFeedResponse(List.of(), 0, 0, page);
            }
            List<AdminJobFeedItemResponse> resultList = jobs.getContent();
            enrichSkills((List<JobFeedItemResponse>) (List<?>) resultList);
            return new AdminJobFeedResponse(resultList, jobs.getTotalPages(), jobs.getTotalElements(), jobs.getNumber());
        } catch (Exception e) {
            System.err.println("Lỗi khi admin lấy danh sách job đang chờ: " + e.getMessage());
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    private void enrichSkills(List<JobFeedItemResponse> items) {
        if (items == null || items.isEmpty()) {
            return;
        }
        try {
            List<String> jobIds = items.stream()
                    .map(JobFeedItemResponse::getJobId)
                    .toList();
            List<Object[]> skillData = jobRepository.findSkillNamesByJobIds(jobIds);
            Map<String, List<String>> skillsMap = skillData.stream()
                    .collect(Collectors.groupingBy(
                            obj -> (String) obj[0],
                            Collectors.mapping(obj -> (String) obj[1], Collectors.toList())
                    ));
            items.forEach(item -> {
                List<String> skills = skillsMap.getOrDefault(item.getJobId(), List.of());
                item.setSkills(skills);
            });
        } catch (Exception e) {
            System.err.println("Lỗi xảy ra trong quá trình enrichSkills!");
            e.printStackTrace();
        }
    }


    // LRU Cache for view counting to prevent double counting from the same IP
    private static final java.util.Map<String, Long> jobViewCache = java.util.Collections.synchronizedMap(
        new java.util.LinkedHashMap<String, Long>(1000, 0.75f, true) {
            @Override
            protected boolean removeEldestEntry(java.util.Map.Entry<String, Long> eldest) {
                return size() > 5000;
            }
        }
    );

    /**
     * lấy chi tiết của 1 job theo id
     */
    public JobDetailResponse getJobDetail(String jobId, HttpServletRequest request) {
        CustomUserDetails currentUser = securityUtils.getCurrentUserOptional();

        try {
            String clientIp = request.getRemoteAddr();
            String cacheKey = clientIp + "_" + jobId;
            long currentTime = System.currentTimeMillis();
            
            boolean hasViewed = false;
            Long lastViewed = jobViewCache.get(cacheKey);
            if (lastViewed != null && (currentTime - lastViewed < 30 * 60 * 1000)) { // 30 mins cache
                hasViewed = true;
            }

            boolean shouldIncrement = !hasViewed;

            if (currentUser != null) {
                boolean isInternal = currentUser.getAuthorities().stream()
                        .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") ||
                                a.getAuthority().equals("ROLE_RECRUITER"));
                if (isInternal) shouldIncrement = false;
            }

            if (shouldIncrement) {
                jobRepository.incrementViewCount(jobId);
                jobViewCache.put(cacheKey, currentTime);
            }

            Job job = jobRepository.findById(jobId)
                    .orElseThrow(() -> new AppException(ErrorCode.JOB_NOT_FOUND));
            List<Object[]> skillData = jobRepository.findSkillNamesByJobIds(List.of(jobId));
            List<String> skills = skillData.stream()
                    .map(obj -> (String) obj[1])
                    .collect(Collectors.toList());
            Object titleData = job.getTitle();

            JobDetailResponse detail = new JobDetailResponse(
                    job.getId(),
                    titleData,
                    job.getDescription(),
                    job.getPosition(),
                    job.getLocation(),
                    job.getSalaryMin(),
                    job.getSalaryMax(),
                    job.getStatus() != null ? job.getStatus().name() : null,
                    job.getModerationStatus() != null ? job.getModerationStatus().name() : null,
                    job.getViewCount(),
                    job.getCompany() != null ? job.getCompany().getId() : null,
                    job.getCompany() != null ? job.getCompany().getName() : "N/A",
                    job.getCompany() != null ? job.getCompany().getImageUrl() : null,
                    job.getCategory() != null ? job.getCategory().getName() : "N/A",
                    skills,
                    job.getCreatedAt()
            );

            System.out.println("name: " + job.getCompany().getName());
            return detail;
        } catch (Exception e) {
            System.err.println("LỖI HỆ THỐNG : " + e.getMessage());
            e.printStackTrace();
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    /**
     * Xoá bài đăng tuyển dụng (Soft Delete)
     */
    @Transactional
    public void deleteJob(String jobId) {
        CustomUserDetails currentUser = securityUtils.getCurrentUser();
        try {
            Job job = jobRepository.findById(jobId).orElseThrow(
                    () -> new AppException(ErrorCode.JOB_NOT_FOUND));

            job.setDeleted(true);
            jobRepository.save(job);
            logsService.warn(currentUser, "Admin xóa bài đăng: " + job.getPosition() + " (ID: " + jobId + ")");

            String subject = "Bài đăng tuyển dụng đã bị gỡ bỏ";
            String content = generateJobEmailContent(job, "đã bị gỡ bỏ bởi quản trị viên hệ thống", "#ef4444");

            sendNotificationToRecruiterAndAdmin(job, subject, content, "JOB_DELETED", "/");
            messagingTemplate.convertAndSend("/topic/jobs/delete", (Object) jobId);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            logsService.danger(currentUser, "Lỗi hệ thống khi xóa Job ID " + jobId + ": " + e.getMessage());
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    /**
     * Thay đổi trạng thái kiểm duyệt (Moderation)
     */
    @Transactional
    public void changeModerationStatus(String jobId, String modStatus) {
        CustomUserDetails currentUser = securityUtils.getCurrentUser();
        try {
            ModerationStatus newModStatus;
            try {
                newModStatus = ModerationStatus.valueOf(modStatus.toUpperCase());
            } catch (IllegalArgumentException e) {
                logsService.warn(currentUser, "Admin nhập sai trạng thái kiểm duyệt: " + modStatus);
                throw new AppException(ErrorCode.INVALID_INPUT);
            }

            Job job = jobRepository.findById(jobId).orElseThrow(() -> new AppException(ErrorCode.JOB_NOT_FOUND));
            ModerationStatus oldStatus = job.getModerationStatus();
            job.setModerationStatus(newModStatus);

            if (newModStatus == ModerationStatus.RED || newModStatus == ModerationStatus.YELLOW) {
                job.setStatus(JobStatus.PENDING);
            } else if (newModStatus == ModerationStatus.GREEN) {
                job.setStatus(JobStatus.OPEN);
            }
            jobRepository.save(job);
            logsService.warn(currentUser, "Thay đổi kiểm duyệt Job " + job.getPosition() + ": [" + oldStatus + " -> " + newModStatus + "]");

            String subject = "Cập nhật kiểm duyệt bài đăng";
            String color = (newModStatus == ModerationStatus.GREEN) ? "#10b981" : "#f59e0b";
            String content = generateJobEmailContent(job, "đã được cập nhật trạng thái kiểm duyệt thành: <b>" + newModStatus + "</b>", color);

            sendNotificationToRecruiterAndAdmin(job, subject, content, "JOB_MODERATION", "/jobs/" + jobId);

            messagingTemplate.convertAndSend("/topic/jobs/moderation", (Object) Map.of(
                    "jobId", jobId,
                    "status", newModStatus.name()
            ));

        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            logsService.danger(currentUser, "Lỗi hệ thống khi Moderation Job " + jobId + ": " + e.getMessage());
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    /**
     * Thay đổi trạng thái hiển thị (JobStatus)
     */
    @Transactional
    public void changeStatus(String jobId, String status) {
        CustomUserDetails currentUser = securityUtils.getCurrentUser();
        try {
            JobStatus newStatus;
            try {
                newStatus = JobStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                logsService.warn(currentUser, "Admin nhập sai trạng thái Job: " + status);
                throw new AppException(ErrorCode.INVALID_INPUT);
            }
            Job job = jobRepository.findById(jobId).orElseThrow(() -> new AppException(ErrorCode.JOB_NOT_FOUND));
            JobStatus oldStatus = job.getStatus();
            job.setStatus(newStatus);
            jobRepository.save(job);
            logsService.warn(currentUser, "Thay đổi trạng thái Job " + job.getPosition() + ": [" + oldStatus + " -> " + newStatus + "]");
            String subject = "Trạng thái bài đăng đã thay đổi";
            String content = generateJobEmailContent(job, "đã được chuyển sang trạng thái: <b>" + newStatus + "</b>", "#3b82f6");
            sendNotificationToRecruiterAndAdmin(job, subject, content, "JOB_STATUS_CHANGE", "/jobs/" + jobId);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            logsService.danger(currentUser, "Lỗi hệ thống khi đổi status Job " + jobId + ": " + e.getMessage());
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    /**
     * Hàm hỗ trợ: Gửi thông báo cho Recruiter và Admin duy nhất của công ty
     */
    private void sendNotificationToRecruiterAndAdmin(Job job, String subject, String content, String type, String link) {
        User creator = job.getCompanyMember().getUser();
        notificationService.createNotification(creator, null, subject, content, type, link, true);
        companyMemberRepository.findByCompany_IdAndRole(job.getCompany().getId(), CompanyRole.ADMIN)
            .stream()
            .findFirst()
            .ifPresent(adminMember -> {
                User adminUser = adminMember.getUser();
                if (!adminUser.getId().equals(creator.getId())) {
                    notificationService.createNotification(adminUser, null, subject, content, type, link, true);
                }
            });
    }

    /**
     * Hàm hỗ trợ: Tạo nội dung HTML cho Email thông báo Job
     */
    private String generateJobEmailContent(Job job, String actionText, String color) {
        return String.format(
                "<div style='font-family: Arial; padding: 15px; border-left: 4px solid %s;'>" +
                        "<h4>Thông báo từ SkillBridge</h4>" +
                        "<p>Bài đăng vị trí <b>%s</b> tại công ty <b>%s</b> %s.</p>" +
                        "<p>Vui lòng đăng nhập hệ thống để biết thêm chi tiết.</p>" +
                        "</div>",
                color, getJobPositionName(job), job.getCompany().getName(), actionText
        );
    }

    /**
     * Phê duyệt hoặc Từ chối bài đăng đang chờ (PENDING)
     */
    @Transactional
    public void responseJobPending(String jobId, String status) {
        CustomUserDetails currentUser = securityUtils.getCurrentUser();
        System.out.println(currentUser);
        try {
            Job job = jobRepository.findById(jobId)
                    .orElseThrow(() -> new AppException(ErrorCode.JOB_NOT_FOUND));
            if (!"OPEN".equals(status) && !"LOCK".equals(status)) {
                throw new AppException(ErrorCode.INVALID_INPUT);
            }

            String actionDescription = "";
            String subject = "";
            String color = "";

            if ("OPEN".equals(status)) {
                job.setModerationStatus(ModerationStatus.GREEN);
                job.setStatus(JobStatus.OPEN);
                job.setStartDate(date.atStartOfDay());
                LocalDate endDate = LocalDate.now().plusDays(job.getPostingDay());
                job.setEndDate(endDate.atStartOfDay());

                actionDescription = "đã được PHÊ DUYỆT và hiển thị công khai";
                subject = "Tin tuyển dụng của bạn đã được phê duyệt";
                color = "#10b981";
            } else {
                job.setStatus(JobStatus.LOCK);

                actionDescription = "đã bị TỪ CHỐI bởi quản trị viên";
                subject = "Thông báo kết quả duyệt tin tuyển dụng";
                color = "#ef4444";
            }

            jobRepository.save(job);
            logsService.warn(currentUser, "Admin " + status + " bài đăng: " + job.getPosition() + " (ID: " + jobId + ")");

            String content = generateJobEmailContent(job, actionDescription, color);
            sendNotificationToRecruiterAndAdmin(job, subject, content, "JOB_APPROVAL", "/jobs/" + jobId);

            Map<String, Object> updateSignal = Map.of(
                    "jobId", jobId,
                    "newStatus", job.getStatus().name(),
                    "newModStatus", job.getModerationStatus().name()
            );
            messagingTemplate.convertAndSend("/topic/jobs/approval", (Object) updateSignal);

        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Lỗi khi duyệt bài đăng {}: {}", jobId, e.getMessage());
            logsService.logAction(currentUser, "Lỗi duyệt bài đăng " + jobId + ". Chi tiết: " + e.getMessage(), LogLevel.DANGER);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }


    public Job createJD(CreateJobRequest request) {
        CustomUserDetails currentUser = securityUtils.getCurrentUser();
        String userId = currentUser.getUserId();
        var recruiter = companyMemberRepository.findByUser_Id(userId)
                .orElseThrow(() -> new AppException(ErrorCode.MEMBER_NOT_FOUND));

        var category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        Company getComPany = companyRepository.getReferenceById(recruiter.getCompany().getId());
        if (!CompanyStatus.ACTIVE.equals(getComPany.getStatus())) {
            throw new AppException(ErrorCode.EXIT_STATUS_COMPANY);
        }

        SubscriptionOfCompany getSubscriptionOfCompany = subscriptionOfCompanyRepository.findByCompanyIdAndStatus(getComPany.getId(), SubscriptionOfCompanyStatus.OPEN)
                .orElseThrow(() -> new AppException(ErrorCode.SUBSCRIPTION_OF_COMPANY));

        if (getSubscriptionOfCompany.getCurrentJobCount() > getSubscriptionOfCompany.getJobLimit()) {
            throw new AppException(ErrorCode.EXIT_SUBSCRIPTION);
        }

        List<JobSkill> jobSkills = new ArrayList<>();
        StringBuilder textBuilder = new StringBuilder();
        StringBuilder skillBuilder = new StringBuilder();

        Job job = new Job();
        job.setPosition(request.getPosition());
        job.setDescription(request.getDescription());
        job.setCategory(category);
        job.setCompany(recruiter.getCompany());
        job.setCompanyMember(recruiter);
        job.setStatus(JobStatus.PENDING);
        job.setViewCount(0);
        job.setTitle(request.getTitle());
        job.setLocation(request.getLocation());
        job.setSalaryMin(request.getSalaryMin());
        job.setSalaryMax(request.getSalaryMax());
        job.setEndDate(null);
        job.setStartDate(null);
        job.setPostingDay(getSubscriptionOfCompany.getPostingDuration());
        Job savedJob = jobRepository.save(job);
        job.setViewCount(0);
        job.setModerationScore(0f);

        for (JobSkillRequest skillRequest : request.getSkills()) {
            Skill skill = skillRepository.findById(skillRequest.getSkillId())
                    .orElseThrow(() -> new AppException(ErrorCode.SKILL_NOT_FOUND));
            JobSkill jobSkill = JobSkill.builder()
                    .job(savedJob)
                    .skill(skill)
                    .isRequired(skillRequest.getIsRequired())
                    .build();
            jobSkills.add(jobSkill);
            if (skill.getName() != null) {
                skillBuilder.append(skill.getName()).append(", ");
            }
        }

//        job.setModerationStatus(ModerationStatus.YELLOW);

        //object > Text
        textBuilder.append(job.getPosition()).append(". ");
        textBuilder.append(job.getDescription()).append(". ");
        if (job.getCompany() != null && job.getCompany().getName() != null) {
            textBuilder.append(job.getCompany().getName()).append(". ");
        }
        Object titleObj = job.getTitle();
        if (titleObj instanceof Map) {
            String titleText = String.join(" - ", ((Map<String, String>) titleObj).values());
            textBuilder.append(titleText).append(". ");
        } else if (titleObj != null) {
            textBuilder.append(titleObj.toString()).append(". ");
        }

        textBuilder.append(job.getLocation()).append(". ");
        textBuilder.append(job.getSalaryMin()).append(". ");
        textBuilder.append(job.getSalaryMax()).append(". ");

        if (skillBuilder.length() > 0) {
            textBuilder.append(skillBuilder.substring(0, skillBuilder.length() - 2));
        }
        String textFinal = textBuilder.toString();
        getSubscriptionOfCompany.setCurrentJobCount(getSubscriptionOfCompany.getCurrentJobCount() + 1);
        subscriptionOfCompanyRepository.save(getSubscriptionOfCompany);
        //  Text > Vector
        try {
            float[] vector = embeddingService.createEmbedding(textFinal);
            job.setVectorEmbedding(vector);
        } catch (Exception e) {
            System.out.println("Lỗi tạo vector");
            e.printStackTrace();
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
        jobSkillRepository.saveAll(jobSkills);
        Job finalSavedJob = jobRepository.save(job);
        String IdJob = finalSavedJob.getId();


        /// kiểm duyệt nội dung
        System.out.println("đã chạy chức năng check bài spam");
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                System.out.println("ddang chayj chuc nang sapm");
                aiJobService.ai_Check_Approval(IdJob);
            }
        });
        return finalSavedJob;
    }

    @Scheduled(cron = "0 0 0 * * *") // Tự động chạy vào 00:00 mỗi ngày
    @Transactional
    public void handleExpiredSubscriptions() {
        LocalDateTime now = LocalDateTime.now();
        List<SubscriptionOfCompany> expiredPremiumSubs = subscriptionOfCompanyRepository
                .findAllByEndDateBeforeAndStatus(now, SubscriptionOfCompanyStatus.OPEN);

        for (SubscriptionOfCompany expiredSub : expiredPremiumSubs) {
            expiredSub.setStatus(SubscriptionOfCompanyStatus.CLOSE);
            subscriptionOfCompanyRepository.save(expiredSub);

            Optional<SubscriptionOfCompany> oldFreeSubOpt = subscriptionOfCompanyRepository
                    .findByCompanyIdAndName(expiredSub.getCompany().getId(), SubscriptionPlanStatus.FREE);

            if (oldFreeSubOpt.isPresent()) {
                SubscriptionOfCompany freeSub = oldFreeSubOpt.get();

                freeSub.setStatus(SubscriptionOfCompanyStatus.OPEN);
                freeSub.setCurrentJobCount(0);
                freeSub.setStartDate(now);
                freeSub.setEndDate(now.plusMonths(1));

                subscriptionOfCompanyRepository.save(freeSub);
                System.out.println("Doanh nghiệp " + expiredSub.getCompany().getName() + " đã quay lại dùng gói FREE cũ.");
            }
        }

        List<SubscriptionOfCompany> expiredFreeSubs = subscriptionOfCompanyRepository
                .findAllByEndDateBeforeAndStatusAndName(now, SubscriptionOfCompanyStatus.OPEN, SubscriptionPlanStatus.FREE);

        for (SubscriptionOfCompany freeSub : expiredFreeSubs) {
            freeSub.setCurrentJobCount(0);
            freeSub.setStartDate(now);
            freeSub.setEndDate(now.plusMonths(1));
            subscriptionOfCompanyRepository.save(freeSub);
            System.out.println("Đã tự động gia hạn chu kỳ FREE mới cho doanh nghiệp: " + freeSub.getCompany().getName());
        }
    }

    @Transactional(readOnly = true)
    public List<JobResponse> find_JD_of_Company() {
        CustomUserDetails currentUser = securityUtils.getCurrentUser();
        String userId = currentUser.getUserId();
        var companyMember = companyMemberRepository.findByUser_Id(userId)
                .orElseThrow(() -> new AppException(ErrorCode.MEMBER_NOT_FOUND));

        String companyId = companyMember.getCompany().getId();

        List<Job> rawJobs = jobRepository.findJobsByCompanyId(companyId);
        return rawJobs.stream()
                .map(this::mapToJobResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public JobResponse getIn4_of_JD_of_Company(String id) {
        CustomUserDetails currentUser = securityUtils.getCurrentUser();
        String userId = currentUser.getUserId();
        companyMemberRepository.findByUser_Id(userId)
                .orElseThrow(() -> new AppException(ErrorCode.MEMBER_NOT_FOUND));

        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.JOB_NOT_FOUND));

        return mapToJobResponse(job);
    }

    public JobResponse mapToJobResponse(Job job) {
        return JobResponse.builder()
            .id(job.getId())
            .title(job.getTitle())
            .position(getJobPositionName(job))
            .description(job.getDescription())
            .location(job.getLocation())
            .status(job.getStatus() != null ? job.getStatus().name() : null)
            .salaryMin(job.getSalaryMin())
            .salaryMax(job.getSalaryMax())

            .category(job.getCategory() != null ?
                JobResponse.CategoryDTO.builder()
                    .id(job.getCategory().getId())
                    .name(job.getCategory().getName())
                    .build() : null)

            .company(job.getCompany() != null ?
                JobResponse.CompanyDTO.builder()
                    .id(job.getCompany().getId())
                    .name(job.getCompany().getName())
                    .logoUrl(job.getCompany().getImageUrl())
                    .build() : null)

            .skills(job.getJobSkills() != null ?
                job.getJobSkills().stream().map(js ->
                    JobResponse.JobSkillDTO.builder()
                        .name(js.getSkill().getName())
                        .required(js.getIsRequired())
                        .build()
                ).toList()
                : new ArrayList<>())
            .build();
    }

    public static String getJobPositionName(Job job) {
        if (job == null) return "N/A";

        // 1. Check if position field is valid
        String pos = job.getPosition();
        if (pos != null && !pos.trim().isEmpty() && !pos.equalsIgnoreCase("N/A")) {
            return pos;
        }

        // 2. Try to extract from title JSON map
        Map<String, Object> titleMap = job.getTitle();
        if (titleMap != null && !titleMap.isEmpty()) {
            // Prefer Vietnamese, then English, then any first key
            if (titleMap.containsKey("vi")) return String.valueOf(titleMap.get("vi"));
            if (titleMap.containsKey("en")) return String.valueOf(titleMap.get("en"));

            Object firstValue = titleMap.values().stream().findFirst().orElse(null);
            if (firstValue != null) return String.valueOf(firstValue);
        }

        return (pos != null) ? pos : "N/A";
    }

    public Job updateStatus(String id, int type) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated() ||
                !(authentication.getPrincipal() instanceof CustomUserDetails)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        String userId = userDetails.getUserId();

        var recruiter = companyMemberRepository.findByUser_Id(userId)
                .orElseThrow(() -> new AppException(ErrorCode.MEMBER_NOT_FOUND));

        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.JOB_NOT_FOUND));

        boolean isAdmin = recruiter.getRole() == CompanyRole.ADMIN;
        boolean isJobOwner = job.getCompanyMember().getId().equals(recruiter.getId());

        if (!isAdmin && !isJobOwner) {
            throw new AppException(ErrorCode.EXITS_YOUR_ROLE);
        }
        ///  thay đổi trạng thái thành khóa

        if (type == 1) {
            List<Application> getListCandidateINJD = applicationRepository.findByJob_Id(id);
            String nameJD = getJobPositionName(job);

            String companyName = job.getCompany().getName();
            String subject = "[SkillBridge] Thông báo quan trọng về vị trí: " + nameJD;
            String content = String.format(
                    "<div style='font-family: Arial; padding: 20px; border: 1px solid #eee; border-radius: 10px;'>" +
                            "   <h2 style='color: #2c3e50;'>Thông báo từ SkillBridge</h2>" +
                            "   <p>Chào bạn,</p>" +
                            "   <p>Công ty <b>%s</b> xin thông báo rằng tin tuyển dụng cho vị trí <b>%s</b> hiện đã bị chủ doanh nghiệp xóa bài đi.</p>" +
                            "   <div style='background: #f9f9f9; padding: 15px; border-left: 4px solid #3498db;'>" +
                            "       <b>Trạng thái hồ sơ:</b> Hệ thống đang trong quá trình tổng hợp và phản hồi kết quả cuối cùng." +
                            "   </div>" +
                            "   <p>Cảm ơn bạn đã tin tưởng và ứng tuyển qua hệ thống SkillBridge. Bạn có thể tiếp tục tìm kiếm các cơ hội khác phù hợp hơn trên nền tảng của chúng tôi.</p>" +
                            "   <br><p>Trân trọng,<br><b>Đội ngũ hỗ trợ SkillBridge</b></p>" +
                            "</div>",
                    companyName, nameJD
            );

            getListCandidateINJD.forEach(application -> {
                Candidate candidate = application.getCandidate();
                if (candidate != null) {
                    mailService.sendToEmail(senderEmail, application.getEmail(), subject, content);
                }
            });
            job.setStatus(JobStatus.LOCK);
        }
        ///  thay đổi trạng thái thành đóng
        else if(type == 2){
            job.setStatus(JobStatus.CLOSED);

        }
        job.setDeleted(true);
        jobRepository.save(job);

        return job;
    }

    @Transactional
    public Job updateJD(String jobId, CreateJobRequest request) {
        CustomUserDetails currentUser = securityUtils.getCurrentUser();
        String userId = currentUser.getUserId();
        var recruiter = companyMemberRepository.findByUser_Id(userId)
                .orElseThrow(() -> new AppException(ErrorCode.MEMBER_NOT_FOUND));

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new AppException(ErrorCode.JOB_NOT_FOUND));

        if (!job.getCompanyMember().getId().equals(recruiter.getId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        var category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        job.setPosition(request.getPosition());
        job.setDescription(request.getDescription());
        job.setCategory(category);
        job.setTitle(request.getTitle());
        job.setLocation(request.getLocation());
        job.setSalaryMin(request.getSalaryMin());
        job.setSalaryMax(request.getSalaryMax());
        job.setStatus(JobStatus.PENDING);
        job.setModerationStatus(ModerationStatus.YELLOW);
        job.setModerationScore(0f);

        job.getJobSkills().clear();

        Set<String> processedSkillIds = new HashSet<>();
        StringBuilder textBuilder = new StringBuilder();
        StringBuilder skillBuilder = new StringBuilder();

        for (JobSkillRequest skillRequest : request.getSkills()) {
            if (processedSkillIds.contains(skillRequest.getSkillId())) {
                continue;
            }

            Skill skill = skillRepository.findById(skillRequest.getSkillId())
                    .orElseThrow(() -> new AppException(ErrorCode.SKILL_NOT_FOUND));

            JobSkill jobSkill = JobSkill.builder()
                    .job(job)
                    .skill(skill)
                    .isRequired(skillRequest.getIsRequired())
                    .build();

            job.getJobSkills().add(jobSkill);
            processedSkillIds.add(skillRequest.getSkillId());

            if (skill.getName() != null) {
                skillBuilder.append(skill.getName()).append(", ");
            }
        }
        textBuilder.append(job.getPosition()).append(". ");
        textBuilder.append(job.getDescription()).append(". ");

        if (job.getCompany() != null && job.getCompany().getName() != null) {
            textBuilder.append(job.getCompany().getName()).append(". ");
        }

        if (job.getTitle() != null) {
            textBuilder.append(job.getTitle().toString()).append(". ");
        }

        textBuilder.append(job.getLocation()).append(". ");
        textBuilder.append(job.getSalaryMin()).append(". ");
        textBuilder.append(job.getSalaryMax()).append(". ");

        if (!skillBuilder.isEmpty()) {
            textBuilder.append(skillBuilder.substring(0, skillBuilder.length() - 2));
        }

        try {
            float[] vector = embeddingService.createEmbedding(textBuilder.toString());
            job.setVectorEmbedding(vector);
        } catch (Exception e) {
            e.printStackTrace();
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                System.out.println("Đang chạy chức năng duyệt AI bất đồng bộ...");
                aiJobService.ai_Check_Approval(jobId);
            }
        });
        jobRepository.save(job);


        return job;
    }


    @PersistenceContext
    private EntityManager entityManager;

    @Transactional(rollbackFor = Exception.class)
    public Job repostJD(String id) {
        CustomUserDetails currentUser = securityUtils.getCurrentUser();
        String userId = currentUser.getUserId();

        var recruiter = companyMemberRepository.findByUser_Id(userId)
                .orElseThrow(() -> new AppException(ErrorCode.MEMBER_NOT_FOUND));

        Job oldJob = jobRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.JOB_NOT_FOUND));

        boolean isAdmin = recruiter.getRole() == CompanyRole.ADMIN;
        boolean isJobOwner = oldJob.getCompanyMember().getId().equals(recruiter.getId());

        if (!isAdmin && !isJobOwner) {
            throw new AppException(ErrorCode.EXITS_YOUR_ROLE);
        }

        if (!JobStatus.CLOSED.equals(oldJob.getStatus())) {
            throw new AppException(ErrorCode.JOB_STATUS_EXITS);
        }

        Company company = oldJob.getCompany();
        if(!CompanyStatus.ACTIVE.equals(company.getStatus())) {
            throw new AppException(ErrorCode.EXIT_STATUS_COMPANY);
        }

        SubscriptionOfCompany subscription = subscriptionOfCompanyRepository
                .findByCompanyIdAndStatus(company.getId(), SubscriptionOfCompanyStatus.OPEN)
                .orElseThrow(() -> new AppException(ErrorCode.SUBSCRIPTION_OF_COMPANY));

        if(subscription.getCurrentJobCount() >= subscription.getJobLimit()) {
            throw new AppException(ErrorCode.EXIT_SUBSCRIPTION);
        }



        float[] vectorToCheck = oldJob.getVectorEmbedding();
        String vectorJsonString = Arrays.toString(vectorToCheck);
        if (vectorToCheck != null) {
            if (!CheckSpam(vectorJsonString, company.getId(), JobStatus.OPEN.name())) {
                throw new AppException(ErrorCode.SPAM_JD);
            }
        }
        int postingDay = subscription.getPostingDuration();

        Job newJob = Job.builder()
                .title(oldJob.getTitle() != null ? new HashMap<>(oldJob.getTitle()) : null)
                .position(oldJob.getPosition())
                .description(oldJob.getDescription())
                .category(oldJob.getCategory())
                .company(oldJob.getCompany())
                .location(oldJob.getLocation())
                .salaryMin(oldJob.getSalaryMin())
                .salaryMax(oldJob.getSalaryMax())
                .companyMember(recruiter)
                .status(JobStatus.OPEN)
                .viewCount(0)
                .moderationScore(0f)
                .moderationStatus(ModerationStatus.GREEN)
                .postingDay(subscription.getPostingDuration())
                .vectorEmbedding(oldJob.getVectorEmbedding() != null ? oldJob.getVectorEmbedding().clone() : null)
                .startDate(date.atStartOfDay())
                .endDate(date.atStartOfDay().plusDays(postingDay))
                .build();

        Job savedJob = jobRepository.saveAndFlush(newJob);

        if (oldJob.getJobSkills() != null && !oldJob.getJobSkills().isEmpty()) {
            List<JobSkill> newJobSkills = oldJob.getJobSkills().stream()
                    .map(oldSkill -> JobSkill.builder()
                            .job(savedJob)
                            .skill(oldSkill.getSkill())
                            .isRequired(oldSkill.getIsRequired())
                            .build())
                    .collect(Collectors.toList());

            jobSkillRepository.saveAll(newJobSkills);
        }

        subscription.setCurrentJobCount(subscription.getCurrentJobCount() + 1);
        subscriptionOfCompanyRepository.save(subscription);

        return savedJob;
    }

    public Boolean CheckSpam(String vector, String companyId, String status) {
        return jobRepository.findJobByExactVector(vector, companyId, status).isEmpty();
    }


    @Transactional(rollbackFor = Exception.class)
    public JobApplicationRequest applyJob(JobApplicationRequest request, String jobId, MultipartFile cv) throws IOException {
        CustomUserDetails currentUser = securityUtils.getCurrentUser();
        String userId = currentUser.getUserId();

        Candidate candidate = candidateRepository.findByUser_Id(userId)
                .orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND));
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new AppException(ErrorCode.JOB_NOT_FOUND));

        if(!job.getStatus().equals(JobStatus.OPEN)) {
            throw new AppException(ErrorCode.JOB_NO_GREEN);
        }
        if (!job.getModerationStatus().equals(ModerationStatus.GREEN)) {
            throw new AppException(ErrorCode.JOB_NO_GREEN);
        }

        if (applicationRepository.existsByJobAndCandidate(job, candidate)) {
            throw new AppException(ErrorCode.ALREADY_APPLIED);
        }
        String qualificationsSnapshot = null;
        try {
            qualificationsSnapshot = objectMapper.writeValueAsString(candidate.getDegree());
        } catch (JsonProcessingException e) {
            log.error("Lỗi parse qualifications: {}", e.getMessage());
        }
        String cvUrl = fileStorageService.saveFile(cv, "CVs");

        ObjectMapper objectMapper = new ObjectMapper();

        String json = objectMapper.writeValueAsString(request.getParsedContent());
        System.out.println("json: " + json);

        Application application = Application.builder()
                .job(job)
                .candidate(candidate)
                .fullName(request.getName())
                .email(request.getEmail())
                .phoneNumber(request.getNumberPhone())
                .cvUrl(cvUrl)
                .recommendationLetter(request.getRecommendationLetter())
                .qualifications(qualificationsSnapshot)
                .status(ApplicationStatus.PENDING)
                .parsedContentJson(json)
                .build();

        Application savedApp = applicationRepository.saveAndFlush(application);

        try {
            float matchScore = applicationMatchScoringService.computeMatchScore(job, savedApp, candidate);
            savedApp.setAiMatchingScore(matchScore);
            applicationRepository.save(savedApp);
        } catch (Exception e) {
            log.warn("[AI_MATCH] Không tính được điểm phù hợp cho application {}: {}", savedApp.getId(), e.getMessage());
        }

        Map<String, Object> jobTitleMap = job.getTitle();

        String jobPosition = getJobPositionName(job);
        String title = "Ứng tuyển mới: " + request.getName();
        String content = String.format("Ứng viên %s vừa nộp hồ sơ vào vị trí %s. Kiểm tra ngay để không bỏ lỡ tài năng!",
                request.getName(), jobPosition);
        String link = "/recruiter/applications/" + savedApp.getId();

        Set<User> distinctRecruiters = companyMemberRepository.findByCompany_Id(job.getCompany().getId())
                .stream()
                .map(CompanyMember::getUser)
                .collect(Collectors.toSet());

        for (User recruiter : distinctRecruiters) {
            Notification notification = Notification.builder()
                    .user(recruiter)
                    .title(title)
                    .content(content)
                    .read(false)
                    .type("NEW_APPLICATION")
                    .link(link)
                    .build();
            notificationRepository.saveAndFlush(notification);

            try {
                messagingTemplate.convertAndSendToUser(
                        recruiter.getId(),
                        "/queue/notifications",
                        notificationService.mapToResponse(notification)
                );
                log.info("Đã bắn tin nhắn ứng tuyển mới cho Recruiter: {}", recruiter.getEmail());
            } catch (Exception e) {
                log.error("Lỗi WebSocket cho recruiter {}: {}", recruiter.getId(), e.getMessage());
            }
        }
        return request;
    }

    ///  check điều kiện bài đăng có ái apply vào chưa
    public Boolean checkUngVien(String idJD) {
        try {
            Boolean result = false;
            List<Application> getApplyOfJD = applicationRepository.findByJob_Id(idJD);
            if (getApplyOfJD.size() > 0) {
                result = true;
            }
            return result;
        } catch (Exception e) {
            throw new RuntimeException(ErrorCode.JOB_NOT_FOUND.getMessage());
        }
    }

    public String inviteJob(String id, String candidateId) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.JOB_NOT_FOUND));
        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND));

        User user = candidate.getUser();

        // Kiểm tra xem ứng viên đã ứng tuyển chưa
        if (applicationRepository.existsByJobAndCandidate(job, candidate)) {
            throw new AppException(ErrorCode.ALREADY_APPLIED);
        }

        CustomUserDetails currentUser = securityUtils.getCurrentUser();
        Company company = companyRepository.findById(job.getCompany().getId())
                .orElseThrow(() -> new AppException(ErrorCode.JOB_NOT_FOUND));

        // Xác thực quyền của thành viên công ty
        companyMemberRepository.findByCompany_IdAndUser_Id(company.getId(), currentUser.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_COMPANY_MEMBER));

        // --- LOGIC KIỂM TRA VÀ XỬ LÝ LỜI MỜI ---
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime newExpiration = now.plusDays(3); // Thời hạn 3 ngày

        Optional<JobInvitation> existingInvitationOpt = jobInvitationRepository.findByJobAndCandidate(job, candidate);

        if (existingInvitationOpt.isPresent()) {
            JobInvitation existingInvitation = existingInvitationOpt.get();

            // Nếu lời mời vẫn còn hạn -> Throw Exception
            if (existingInvitation.getExpiresAt().isAfter(now)) {
                // Lưu ý: Bạn cần khai báo thêm INVITATION_ALREADY_SENT trong file ErrorCode của bạn
                throw new AppException(ErrorCode.INVITATION_ALREADY_SENT);
            } else {
                // Nếu lời mời đã hết hạn -> Gia hạn lời mời cũ (không tạo mới)
                existingInvitation.setExpiresAt(newExpiration);
                jobInvitationRepository.save(existingInvitation);
            }
        } else {
            // Nếu chưa từng có lời mời -> Tạo lời mời mới (đã bỏ status)
            JobInvitation newInvitation = JobInvitation.builder()
                    .job(job)
                    .candidate(candidate)
                    .expiresAt(newExpiration)
                    .build();
            jobInvitationRepository.save(newInvitation);
        }

        // --- TẠO NỘI DUNG THÔNG BÁO ---
        String title = "Lời mời ứng tuyển từ " + company.getName();
        String formattedExpiration = newExpiration.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));

        String messageBody = String.format(
                "Chào %s,\n\nCông ty %s đã gửi lời mời bạn ứng tuyển vào vị trí %s.\n" +
                        "Lời mời này có hiệu lực trong vòng 3 ngày (đến %s).\n" +
                        "Hãy truy cập hệ thống để xem chi tiết và ứng tuyển ngay!\n" +
                        "",
                candidate.getName(),
                company.getName(),
                getJobPositionName(job),
                formattedExpiration

        );

        // --- GỬI THÔNG BÁO ---
        notificationService.createNotification(
                user,
                user.getEmail(),
                title,
                messageBody,
                "JOB_INVITATION",
                "/jobs/" + id,
                true
        );

        return "Gửi lời mời ứng tuyển thành công!";
    }

    /**
     * Lấy danh sách apply của tôi
     */
    public List<AppliedJobResponse> getMyAppliedJobs() {
        String currentUserId = securityUtils.getCurrentUser().getUserId();

        List<Application> applications = applicationRepository.findAllByCandidateIdOrderByCreatedAtDesc(currentUserId);
        return applications.stream()
            .map(app -> AppliedJobResponse.builder()
                .applicationId(app.getId())
                .jobId(app.getJob().getId())
                .jobPosition(app.getJob().getPosition())
                .companyName(app.getJob().getCompany().getName())
                .companyLogo(app.getJob().getCompany().getImageUrl())
                .location(app.getJob().getLocation())
                .salaryMin(app.getJob().getSalaryMin())
                .salaryMax(app.getJob().getSalaryMax())
                .status(app.getStatus())
                .appliedAt(app.getCreatedAt())
                .build())
            .collect(Collectors.toList());
    }

    ///  Lấy danh sách địa phương
    public List<provinces> getALlProvinces() {
        return provincesRepository.findAllProvincesCustom();
    }
    public provinces deleteProvince(String id) {
        provinces deleteProvince = provincesRepository.findById(id).orElse(null);
        deleteProvince.setIsDeleted(!deleteProvince.getIsDeleted());

        return provincesRepository.save(deleteProvince);
    }
    public provinces updateProvince(String id, provinces request) {
        provinces existingProvince = provincesRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tỉnh thành với ID: " + id));

        if (request.getName() != null) {
            existingProvince.setName(request.getName());
        }
   if (request.getIsDeleted() != null) {
            existingProvince.setIsDeleted(request.getIsDeleted());
        }
    return provincesRepository.save(existingProvince);
    }

}
