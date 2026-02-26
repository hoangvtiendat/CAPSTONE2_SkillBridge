package com.skillbridge.backend.service;
import com.skillbridge.backend.config.CustomUserDetails;
import com.skillbridge.backend.dto.response.*;
import com.skillbridge.backend.entity.Job;
import com.skillbridge.backend.entity.SystemLog;
import com.skillbridge.backend.enums.JobStatus;
import com.skillbridge.backend.enums.LogLevel;
import com.skillbridge.backend.enums.ModerationStatus;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.repository.JobRepository;
import com.skillbridge.backend.repository.SystemLogRepository;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class JobService {

    private final JobRepository jobRepository;
    private final SystemLogRepository systemLogRepository;
    private final SystemLogService logsService;

    public JobService(
            JobRepository jobRepository,
            SystemLogRepository systemLogRepository,
            SystemLogService logsService) {
        this.jobRepository = jobRepository;
        this.systemLogRepository = systemLogRepository;
        this.logsService = logsService;
    }

    public JobFeedResponse getJobFeed(String cursor, int limit, String categoryId, String location, Double salary) {
        System.out.println("--- GỌI API GET FEED ---");
        Pageable pageable = PageRequest.of(0, limit + 1);

        List<JobFeedItemResponse> jobFeed = jobRepository.getJobFeedFiltered(
                cursor, JobStatus.OPEN, categoryId, location, salary, pageable
        );

        if (jobFeed.isEmpty()) {
            System.out.println("Kết quả: Rỗng (Không tìm thấy job nào khớp điều kiện)");
            return new JobFeedResponse(List.of(), null, false);
        }

        boolean hasMore = jobFeed.size() > limit;

        List<JobFeedItemResponse> resultList = hasMore
                ? jobFeed.subList(0, limit)
                : jobFeed;
        System.out.println("Logic - hasMore: " + hasMore);
        System.out.println("Logic - Số lượng job thực tế trả về Client: " + resultList.size());

        enrichSkills(resultList);

        String nextCursor = null;
        if (hasMore) {
            nextCursor = jobFeed.get(limit).getJobId();
        }
        System.out.println("Next Cursor cho trang sau: " + nextCursor);
        System.out.println("--- KẾT THÚC API ---");

        return new JobFeedResponse(resultList, nextCursor, hasMore);
    }

    public AdminJobFeedResponse adminGetJob(String cursor, int limit, String status, String modStatus) {
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

            // 2. Chuyển đổi an toàn moderationStatus
            ModerationStatus newModStatus = null;
            if (modStatus != null && !modStatus.isEmpty()) {
                try {
                    newModStatus = ModerationStatus.valueOf(modStatus.toUpperCase());
                } catch (IllegalArgumentException e) {
                    System.out.println("Lưu ý: ModerationStatus sai định dạng [" + modStatus + "], tự động bỏ qua filter modStatus.");
                }
            }

            Pageable pageable = PageRequest.of(0, limit + 1);
            List<AdminJobFeedItemResponse> jobs = jobRepository.adminGetJobs(cursor, newStatus, newModStatus, pageable);

            if (jobs.isEmpty()) {
                return new AdminJobFeedResponse(List.of(), null, false);
            }

            boolean hasMore = jobs.size() > limit;
            List<AdminJobFeedItemResponse> resultList = hasMore ? jobs.subList(0, limit) : jobs;

            enrichSkills((List<JobFeedItemResponse>) (List<?>) resultList);

            String nextCursor = hasMore ? jobs.get(limit).getJobId() : null;

            return new AdminJobFeedResponse(resultList, nextCursor, hasMore);

        } catch (Exception e) {
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
            Map<String, Object> titleMap = job.getTitle();

            JobDetailResponse detail = new JobDetailResponse(
                    job.getId(),
                    titleMap,
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

        }catch (Exception e) {
            System.err.println("LỖI HỆ THỐNG : " + e.getMessage());
            e.printStackTrace();
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    @Transactional
    public void deleteJob(CustomUserDetails userDetails, String jobId) {

        System.out.println("BẮT ĐẦU XÓA JOB");
        System.out.println("ID: " + jobId);
        try{
            Job job = jobRepository.findById(jobId).orElseThrow(() -> {
                System.out.println("Không tìm thấy Job ID " + jobId + " trong cơ sở dữ liệu.");
                return new AppException(ErrorCode.JOB_NOT_FOUND);
            });
            String jobDescription = job.getDescription();
            SystemLog log = new SystemLog();
            job.setStatus(JobStatus.DELETE);
            jobRepository.save(job);
            logsService.logAction(userDetails, "Admin xóa bài đăng tuyển dụng: " + jobDescription + " (ID: " + jobId + ")", LogLevel.WARNING);

            System.out.println("Đã xóa thành công Job ID: " + jobId);

        }  catch (Exception e) {
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

            if (newModStatus == ModerationStatus.RED||newModStatus == ModerationStatus.YELLOW) {
                job.setStatus(JobStatus.PENDING);
                System.out.println("Job vi phạm (RED) hoặc đang nghi ngờ (YELLOW) - Tự động đóng bài đăng.");
            }
            jobRepository.save(job);

            SystemLog log = new SystemLog();
            logsService.logAction(userDetails, "Thay đổi kiểm duyệt Job ID: " + jobId + " [" + oldStatus + " -> " + newModStatus + "]",LogLevel.WARNING);

            System.out.println("Đã cập nhật ModerationStatus sang " + newModStatus);

        }  catch (Exception e) {
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
            logsService.logAction(userDetails, "Thay đổi trạng thái Job ID: " + jobId + " [" + oldStatus + " -> " + newStatus + "]",LogLevel.WARNING);

            System.out.println("Đã cập nhật status sang " + newStatus);

        }  catch (Exception e) {
            System.err.println("Lỗi hệ thống khi cập nhật status: " + e.getMessage());
            logsService.logAction(userDetails, "Lỗi hệ thống khi cập nhật status Job ID " + jobId + ". Chi tiết: " + e.getMessage(), LogLevel.DANGER);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }
}
