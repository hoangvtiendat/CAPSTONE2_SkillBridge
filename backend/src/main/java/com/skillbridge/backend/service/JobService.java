package com.skillbridge.backend.service;

import com.skillbridge.backend.dto.response.JobFeedItemResponse;
import com.skillbridge.backend.dto.response.JobFeedResponse;
import com.skillbridge.backend.enums.JobStatus;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.repository.JobRepository;
import org.springframework.data.domain.Page;
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
}
