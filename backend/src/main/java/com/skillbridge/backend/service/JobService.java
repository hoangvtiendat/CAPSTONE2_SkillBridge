package com.skillbridge.backend.service;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillbridge.backend.config.CustomUserDetails;
import com.skillbridge.backend.dto.request.CreateJobRequest;
import com.skillbridge.backend.dto.request.JobSkillRequest;
import com.skillbridge.backend.dto.response.JobFeedItemResponse;
import com.skillbridge.backend.dto.response.JobFeedResponse;
import com.skillbridge.backend.dto.response.JobResponse;
import com.skillbridge.backend.entity.Job;
import com.skillbridge.backend.entity.JobSkill;
import com.skillbridge.backend.entity.Skill;
import com.skillbridge.backend.enums.JobStatus;
import com.skillbridge.backend.enums.ModerationStatus;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class JobService {
    private final JobRepository jobRepository;
    private final CategoryRepository categoryRepository;
    private final SkillRepository skillRepository;
    private final JobSkillRepository jobSkillRepository;
    private final CompanyMemberRepository companyMemberRepository;
    private final EmbeddingService embeddingService;

    public JobFeedResponse getJobFeed(String cursor, int limit, String categoryId, String location, Double salary) {
        System.out.println("--- GỌI API GET FEED ---");
        System.out.println("Input - Cursor: " + cursor);
        System.out.println("Input - Limit: " + limit);
        System.out.println("Filter - CategoryId: " + categoryId);
        System.out.println("Filter - Location: " + location);
        System.out.println("Filter - Salary: " + salary);
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
        System.out.println("Output - Next Cursor cho trang sau: " + nextCursor);
        System.out.println("--- KẾT THÚC API ---");

        return new JobFeedResponse(resultList, nextCursor, hasMore);
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

        for(JobSkillRequest skillRequest : request.getSkills()) {
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
        if(job.getStatus() == JobStatus.PENDING){
            throw new AppException(ErrorCode.EXITS_JF_STATUS);
        }
        job.setPosition(request.getPosition());
        job.setDescription(request.getDescription());
        job.setCategory(category);
        job.setTitle(request.getTitle());
        job.setLocation(request.getLocation());
        job.setSalaryMin(request.getSalaryMin());
        job.setSalaryMax(request.getSalaryMax());

        job.setModerationStatus(ModerationStatus.YELLOW);
        job.setModerationScore(0f);


        jobSkillRepository.deleteAllByJobId(jobId);

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

}
