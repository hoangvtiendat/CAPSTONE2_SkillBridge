package com.skillbridge.backend.service;

import com.skillbridge.backend.config.CustomUserDetails;
import com.skillbridge.backend.dto.response.*;
import com.skillbridge.backend.entity.*;
import com.skillbridge.backend.config.CustomUserDetails;
import com.skillbridge.backend.dto.request.CreateJobRequest;
import com.skillbridge.backend.dto.request.JobSkillRequest;
import com.skillbridge.backend.dto.response.JobFeedItemResponse;
import com.skillbridge.backend.dto.response.JobFeedResponse;
import com.skillbridge.backend.dto.response.JobResponse;
import com.skillbridge.backend.entity.Job;
import com.skillbridge.backend.enums.*;
import com.skillbridge.backend.enums.ModerationStatus;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.repository.JobRepository;
import org.springframework.data.domain.Page;
import com.skillbridge.backend.repository.SystemLogRepository;
import jakarta.transaction.Transactional;
import com.skillbridge.backend.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class JobService {
    private final JobRepository jobRepository;
    private final SystemLogRepository systemLogRepository;
    private final SystemLogService logsService;
    private final CategoryRepository categoryRepository;
    private final SkillRepository skillRepository;
    private final JobSkillRepository jobSkillRepository;
    private final CompanyMemberRepository companyMemberRepository;
    private final EmbeddingService embeddingService;
    private final CompanyRepository companyRepository;


    public Map<String, Object> getJobFeed(int page, String cursor, int limit, String categoryId, String location, Double salary) {
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

    public Map<String, Object> adminGetJob(int page, String cursor, int limit, String status, String modStatus) {
        System.out.println("--- ADMIN: BẮT ĐẦU LẤY DANH SÁCH JOB ---");
        try {
            JobStatus newStatus = null;
            if (status != null && !status.isEmpty()) {
                try {
                    newStatus = JobStatus.valueOf(status.toUpperCase());
                } catch (IllegalArgumentException e) {
                    System.out.println("Lưu ý: JobStatus sai định dạng [" + status + "], tự động bỏ qua filter status.");
                }
            }

            ModerationStatus newModStatus = null;
            if (modStatus != null && !modStatus.isEmpty()) {
                try {
                    newModStatus = ModerationStatus.valueOf(modStatus.toUpperCase());
                } catch (IllegalArgumentException e) {
                    System.out.println("Lưu ý: ModerationStatus sai định dạng [" + modStatus + "], tự động bỏ qua filter modStatus.");
                }
            }

            Pageable pageable = PageRequest.of(page, limit);
            List<AdminJobFeedItemResponse> jobs = jobRepository.adminGetJobs(cursor, newStatus, newModStatus, pageable);

            if (jobs.isEmpty()) {
                return Map.of(
                        "jobs", List.of(),
                        "totalPages", 0,
                        "totalElements", 0,
                        "currentPage", page
                );
            }

            enrichSkills((List<JobFeedItemResponse>) (List<?>) jobs);

            // Vì repo adminGetJobs trả về List, chúng ta không có tổng số bản ghi dễ dàng nếu không dùng Page.
            // Nhưng hiện tại để demo/vẩy lỗi, tôi sẽ tạm thời trả về Map đơn giản.
            // Nếu muốn chuẩn 1, 2, 3 thì Repo nên trả về Page<AdminJobFeedItemResponse>.

            return Map.of(
                    "jobs", jobs,
                    "currentPage", page
            );

        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("Lỗi khi admin lấy danh sách job: " + e.getMessage());
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    private void enrichSkills(List<JobFeedItemResponse> items) {
        if (items == null || items.isEmpty()) {
            System.out.println("enrichSkills: Danh sách trống, bỏ qua mapping.");
            return;
        }

        try {
            List<String> jobIds = items.stream()
                    .map(JobFeedItemResponse::getJobId)
                    .toList();

            System.out.println("enrichSkills: Đang lấy Skill cho " + jobIds.size() + " Jobs.");

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

            System.out.println("enrichSkills: Mapping thành công.");
        } catch (Exception e) {
            System.err.println("Lỗi xảy ra trong quá trình enrichSkills!");
            e.printStackTrace();
        }
    }

    public JobDetailResponse getJobDetail(String jobId) {
        try {
            System.out.println("--- XEM CHI TIẾT JOB ID: " + jobId + " ---");

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
                    job.getCompany() != null ? job.getCompany().getId() : null,
                    job.getCompany() != null ? job.getCompany().getName() : "N/A",
                    job.getCompany() != null ? job.getCompany().getImageUrl() : null,
                    job.getCategory() != null ? job.getCategory().getName() : "N/A",
                    skills,
                    job.getCreatedAt()
            );
            return detail;

        } catch (Exception e) {
            System.err.println("LỖI HỆ THỐNG : " + e.getMessage());
            e.printStackTrace();
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    @Transactional
    public void deleteJob(CustomUserDetails userDetails, String jobId) {

        System.out.println("BẮT ĐẦU XÓA JOB");
        System.out.println("ID: " + jobId);
        try {
            Job job = jobRepository.findById(jobId).orElseThrow(() -> {
                System.out.println("Không tìm thấy Job ID " + jobId + " trong cơ sở dữ liệu.");
                return new AppException(ErrorCode.JOB_NOT_FOUND);
            });
            String jobDescription = job.getDescription();
            SystemLog log = new SystemLog();
            job.setIsDeleted(true);
            jobRepository.save(job);
            logsService.logAction(userDetails, "Admin xóa bài đăng tuyển dụng: " + jobDescription + " (ID: " + jobId + ")", LogLevel.WARNING);

            System.out.println("Đã xóa thành công Job ID: " + jobId);

        } catch (Exception e) {
            System.err.println("Lỗi khi xóa job: " + e.getMessage());
            logsService.logAction(userDetails, "Lỗi hệ thống khi xóa Job ID " + jobId + ". Chi tiết: " + e.getMessage(), LogLevel.DANGER);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    @Transactional
    public void changeModerationStatus(CustomUserDetails userDetails, String jobId, String modStatus) {
        System.out.println("--- CẬP NHẬT TRẠNG THÁI KIỂM DUYỆT ---");
        try {
            ModerationStatus newModStatus;
            try {
                newModStatus = ModerationStatus.valueOf(modStatus.toUpperCase());
            } catch (IllegalArgumentException e) {
                logsService.logAction(userDetails, "Admin nhập sai trạng thái kiểm duyệt: " + modStatus, LogLevel.WARNING);
                throw new AppException(ErrorCode.INVALID_INPUT);
            }

            Job job = jobRepository.findById(jobId)
                    .orElseThrow(() -> new AppException(ErrorCode.JOB_NOT_FOUND));

            ModerationStatus oldStatus = job.getModerationStatus();
            job.setModerationStatus(newModStatus);

            if (newModStatus == ModerationStatus.RED || newModStatus == ModerationStatus.YELLOW) {
                job.setStatus(JobStatus.PENDING);
                System.out.println("Job vi phạm (RED) hoặc đang nghi ngờ (YELLOW) - Tự động đóng bài đăng.");
            }
            if (newModStatus == ModerationStatus.GREEN) {
                job.setStatus(JobStatus.OPEN);
                System.out.println("Job an toàn GREEN");
            }
            jobRepository.save(job);

            SystemLog log = new SystemLog();
            logsService.logAction(userDetails, "Thay đổi kiểm duyệt Job ID: " + jobId + " [" + oldStatus + " -> " + newModStatus + "]", LogLevel.WARNING);

            System.out.println("Đã cập nhật ModerationStatus sang " + newModStatus);

        } catch (Exception e) {
            System.err.println("Lỗi hệ thống khi cập nhật Moderation: " + e.getMessage());
            logsService.logAction(userDetails, "Lỗi hệ thống khi cập nhật Moderation Job ID " + jobId + ". Chi tiết: " + e.getMessage(), LogLevel.DANGER);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    @Transactional
    public void changeStatus(CustomUserDetails userDetails, String jobId, String status) {
        System.out.println("--- CẬP NHẬT TRẠNG THÁI KIỂM DUYỆT ---");
        try {
            JobStatus newStatus;
            try {
                newStatus = JobStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                logsService.logAction(userDetails, "Admin nhập sai trạng thái kiểm duyệt: " + status, LogLevel.WARNING);
                throw new AppException(ErrorCode.INVALID_INPUT);
            }

            Job job = jobRepository.findById(jobId)
                    .orElseThrow(() -> new AppException(ErrorCode.JOB_NOT_FOUND));

            JobStatus oldStatus = job.getStatus();
            job.setStatus(newStatus);


            jobRepository.save(job);

            SystemLog log = new SystemLog();
            logsService.logAction(userDetails, "Thay đổi trạng thái Job ID: " + jobId + " [" + oldStatus + " -> " + newStatus + "]", LogLevel.WARNING);

            System.out.println("Đã cập nhật status sang " + newStatus);

        } catch (Exception e) {
            System.err.println("Lỗi hệ thống khi cập nhật status: " + e.getMessage());
            logsService.logAction(userDetails, "Lỗi hệ thống khi cập nhật status Job ID " + jobId + ". Chi tiết: " + e.getMessage(), LogLevel.DANGER);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    public Job createJD(CreateJobRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        String userId = userDetails.getUserId();

        var recruiter = companyMemberRepository.findByUser_Id(userId)
                .orElseThrow(() -> new AppException(ErrorCode.MEMBER_NOT_FOUND));

        var category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        Company getComPany = companyRepository.getReferenceById(recruiter.getCompany().getId());
        if(!CompanyStatus.ACTIVE.equals(getComPany.getStatus())) {
            throw new AppException(ErrorCode.EXIT_STATUS_COMPANY);
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

        job.setModerationStatus(ModerationStatus.YELLOW);

        //object > Text
        textBuilder.append(job.getPosition()).append(". ");
        textBuilder.append(job.getDescription()).append(". ");
        if (job.getCompany() != null && job.getCompany().getName() != null) {
            textBuilder.append(job.getCompany().getName()).append(". ");
        }
        Object titleObj = job.getTitle();
        if (titleObj instanceof java.util.Map) {
            String titleText = String.join(" - ", ((java.util.Map<String, String>) titleObj).values());
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
        jobRepository.save(job);
        return savedJob;
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<JobResponse> find_JD_of_Company() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        String userId = userDetails.getUserId();

        var companyMember = companyMemberRepository.findByUser_Id(userId)
                .orElseThrow(() -> new AppException(ErrorCode.MEMBER_NOT_FOUND));

        String companyId = companyMember.getCompany().getId();

        List<Job> rawJobs = jobRepository.findJobsByCompanyId(companyId);
        return rawJobs.stream()
                .map(this::mapToJobResponse)
                .collect(Collectors.toList());
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public JobResponse getIn4_of_JD_of_Company(String id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        String userId = userDetails.getUserId();

        companyMemberRepository.findByUser_Id(userId)
                .orElseThrow(() -> new AppException(ErrorCode.MEMBER_NOT_FOUND));

        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.JD_NOT_FOUND));

        return mapToJobResponse(job);
    }


    public JobResponse mapToJobResponse(Job job) {
        return JobResponse.builder()
                .id(job.getId())
                .title(job.getTitle())
                .position(job.getPosition())
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

    @Transactional
    public Job updateJD(String jobId, CreateJobRequest request) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        System.out.println("Auth---: " + authentication);
        System.out.println("Principal: " + (authentication != null ? authentication.getPrincipal() : null));
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        String userId = userDetails.getUserId();

        var recruiter = companyMemberRepository.findByUser_Id(userId)
                .orElseThrow(() -> new AppException(ErrorCode.MEMBER_NOT_FOUND));

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new AppException(ErrorCode.JD_NOT_FOUND));

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


        jobSkillRepository.deleteByJobId(jobId);

        List<JobSkill> jobSkills = new ArrayList<>();
        StringBuilder textBuilder = new StringBuilder();
        StringBuilder skillBuilder = new StringBuilder();

        for (JobSkillRequest skillRequest : request.getSkills()) {
            Skill skill = skillRepository.findById(skillRequest.getSkillId())
                    .orElseThrow(() -> new AppException(ErrorCode.SKILL_NOT_FOUND));

            JobSkill jobSkill = JobSkill.builder()
                    .job(job)
                    .skill(skill)
                    .isRequired(skillRequest.getIsRequired())
                    .build();

            jobSkills.add(jobSkill);

            if (skill.getName() != null) {
                skillBuilder.append(skill.getName()).append(", ");
            }
        }

        jobSkillRepository.saveAll(jobSkills);

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

        if (skillBuilder.length() > 0) {
            textBuilder.append(skillBuilder.substring(0, skillBuilder.length() - 2));
        }

        String textFinal = textBuilder.toString();

        try {
            float[] vector = embeddingService.createEmbedding(textFinal);
            job.setVectorEmbedding(vector);
        } catch (Exception e) {
            e.printStackTrace();
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }

        return jobRepository.save(job);
    }

    public Job deleteJD(String id) {
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
                .orElseThrow(() -> new AppException(ErrorCode.JD_NOT_FOUND));

        boolean isAdmin = recruiter.getRole() == CompanyRole.ADMIN;
        boolean isJobOwner = job.getCompanyMember().getId().equals(recruiter.getId());

        if (!isAdmin && !isJobOwner) {
            throw new AppException(ErrorCode.EXITS_YOUR_ROLE);
        }
        job.setStatus(JobStatus.CLOCK);
        job.setIsDeleted(true);
        jobRepository.save(job);

        return job;
    }

    public Job repost(String id) {
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
                .orElseThrow(() -> new AppException(ErrorCode.JD_NOT_FOUND));

        boolean isAdmin = recruiter.getRole() == CompanyRole.ADMIN;
        boolean isJobOwner = job.getCompanyMember().getId().equals(recruiter.getId());

        if (!isAdmin && !isJobOwner) {
            throw new AppException(ErrorCode.EXITS_YOUR_ROLE);
        }

        Job oldPost = jobRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.JD_NOT_FOUND));
        if (JobStatus.CLOSED.equals(oldPost.getStatus())) {
            Job newJob = jobRepository.save(job);
            return newJob;
        }
        throw new AppException(ErrorCode.JOB_STATUS_EXITS);
    }
}
