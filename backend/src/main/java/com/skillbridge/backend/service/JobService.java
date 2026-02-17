package com.skillbridge.backend.service;
import com.skillbridge.backend.config.CustomUserDetails;
import com.skillbridge.backend.dto.response.JobFeedItemResponse;
import com.skillbridge.backend.dto.response.JobFeedResponse;
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
    private SystemLogService LogsService;

    public JobService(JobRepository jobRepository,SystemLogRepository systemLogRepository) {
        this.jobRepository = jobRepository;
        this.systemLogRepository = systemLogRepository;
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

        // Xác định nextCursor từ bản ghi CUỐI CÙNG của danh sách ĐÃ CẮT
        String nextCursor = hasMore
                ? resultList.get(resultList.size() - 1).getJobId()
                : null;
        System.out.println("Next Cursor cho trang sau: " + nextCursor);
        System.out.println("--- KẾT THÚC API ---");

        return new JobFeedResponse(resultList, nextCursor, hasMore);
    }

    public JobFeedResponse adminGetJob(String cursor, int limit, JobStatus status, ModerationStatus modStatus) {
        System.out.println("--- ADMIN: BẮT ĐẦU LẤY DANH SÁCH JOB ---");
        try {
            Pageable pageable = PageRequest.of(0, limit + 1);
            List<JobFeedItemResponse> jobs = jobRepository.adminGetJobs(cursor, status, modStatus, pageable);

            if (jobs.isEmpty()) {
                System.out.println("Kết quả: Không tìm thấy bài đăng nào.");
                return new JobFeedResponse(List.of(), null, false);
            }
            boolean hasMore = jobs.size() > limit;
            List<JobFeedItemResponse> resultList = hasMore ? jobs.subList(0, limit) : jobs;

            System.out.println("Số lượng bản ghi tìm thấy: " + jobs.size());
            System.out.println("hasMore: " + hasMore);

            enrichSkills(resultList);

            String nextCursor = hasMore ? resultList.get(resultList.size() - 1).getJobId() : null;

            System.out.println("Next Cursor: " + nextCursor);
            System.out.println("--- KẾT THÚC LẤY DANH SÁCH ---");

            return new JobFeedResponse(resultList, nextCursor, hasMore);

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

    @Transactional
    public void deleteJob(CustomUserDetails userDetails, String jobId) {

        System.out.println("BẮT ĐẦU XÓA JOB");
        System.out.println("ID: " + jobId);
        try{
            Job job = jobRepository.findById(jobId)
                    .orElseThrow(() -> {
                        System.out.println("Không tìm thấy Job ID " + jobId + " trong cơ sở dữ liệu.");
                        return new AppException(ErrorCode.JOB_NOT_FOUND);
                    });
            Object jobTitle = job.getTitle();
            SystemLog log = new SystemLog();
            job.setStatus(JobStatus.DELETE);
            jobRepository.save(job);
            LogsService.logAction(userDetails, "Admin xóa bài đăng tuyển dụng: " + jobTitle + " (ID: " + jobId + ")", LogLevel.WARNING);

            System.out.println("Đã xóa thành công Job ID: " + jobId);

        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            System.err.println("Lỗi khi xóa job: " + e.getMessage());
            LogsService.logAction(userDetails, "Lỗi hệ thống khi xóa Job ID " + jobId + ". Chi tiết: " + e.getMessage(), LogLevel.DANGER);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    @Transactional
    public void changeModerationStatus(CustomUserDetails userDetails, String jobId, ModerationStatus newModStatus) {
        System.out.println("--- CẬP NHẬT TRẠNG THÁI KIỂM DUYỆT ---");
        try {
            Job job = jobRepository.findById(jobId)
                    .orElseThrow(() -> new AppException(ErrorCode.JOB_NOT_FOUND));

            ModerationStatus oldStatus = job.getModerationStatus();
            job.setModerationStatus(newModStatus);

            if (newModStatus == ModerationStatus.RED) {
                job.setStatus(JobStatus.CLOSED);
                System.out.println("Job vi phạm (RED) - Tự động đóng bài đăng.");
            }
            jobRepository.save(job);

            SystemLog log = new SystemLog();
            LogsService.logAction(userDetails, "Thay đổi kiểm duyệt Job ID: " + jobId + " [" + oldStatus + " -> " + newModStatus + "]",LogLevel.WARNING);

            System.out.println("Đã cập nhật ModerationStatus sang " + newModStatus);

        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            System.err.println("Lỗi hệ thống khi cập nhật Moderation: " + e.getMessage());
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }
}
