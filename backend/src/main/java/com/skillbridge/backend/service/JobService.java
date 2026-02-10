package com.skillbridge.backend.service;

import com.skillbridge.backend.dto.response.JobFeedItemResponse;
import com.skillbridge.backend.dto.response.JobFeedResponse;
import com.skillbridge.backend.enums.JobStatus;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.repository.JobRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Service
public class JobService {

    private final JobRepository jobRepository;

    public JobService(JobRepository jobRepository) {
        this.jobRepository = jobRepository;
    }

    public JobFeedResponse getJobFeed(String cursor, int limit, String categoryId, String location, Double salary) {
        System.out.println("--- GỌI API GET FEED ---");
        System.out.println("Input - Cursor: " + cursor);
        System.out.println("Input - Limit: " + limit);
        System.out.println("Filter - CategoryId: " + categoryId);
        System.out.println("Filter - Location: " + location);
        System.out.println("Filter - Salary: " + salary);
        Pageable pageable = PageRequest.of(0, limit + 1);

        List<JobFeedItemResponse> jobFeed = jobRepository.getJobFeedFiltered(
                cursor, JobStatus.OPEN.toString(), categoryId, location, salary, pageable
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
        System.out.println("Output - Next Cursor cho trang sau: " + nextCursor);
        System.out.println("--- KẾT THÚC API ---");

        return new JobFeedResponse(resultList, nextCursor, hasMore);
    }
}
