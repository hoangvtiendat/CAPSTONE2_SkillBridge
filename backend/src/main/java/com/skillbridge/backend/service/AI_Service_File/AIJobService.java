package com.skillbridge.backend.service.AI_Service_File;

import com.skillbridge.backend.dto.response.CheckApprovalResponse;
import com.skillbridge.backend.dto.response.JobDetailResponse;
import com.skillbridge.backend.entity.Job;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.repository.JobRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AIJobService {
    @Autowired
    JobRepository jobRepository;
    @Autowired
    AiService aiService;
    /// Tách riêng hàm lấy thông tin JD
    ///  lấy vector của JD
    public CheckApprovalResponse getVectorJd(String idJob) {
        try{
            Job job = jobRepository.findById(idJob)
                    .orElseThrow(() -> new RuntimeException(ErrorCode.JOB_NOT_FOUND.getMessage()));
            CheckApprovalResponse checkApprovalResponse = new CheckApprovalResponse();
            checkApprovalResponse.setJobId(job.getId());
            checkApprovalResponse.setTitle(job.getTitle());
            checkApprovalResponse.setVector(job.getVectorEmbedding());
            return checkApprovalResponse;
        } catch (Exception e) {
            throw new RuntimeException(ErrorCode.JOB_NOT_FOUND.getMessage());
        }
    }
    ///  Lấy thông tin cụ thể của bài đăng của JD
    public JobDetailResponse getIn4OfJD(String jobId) {
        try{
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

            System.out.println("name: " +  job.getCompany().getName() );
            return detail;

        }
        catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Lỗi thực sự tại getIn4OfJD: " + e.getMessage(), e);
        }
    }
    ///  Tiến hành cơ chế đèn giao thông
    @Async
    @Transactional
    public void ai_Check_Approval (String dataOfJD){
        try{

            CheckApprovalResponse getVectorJD = getVectorJd(dataOfJD);
            JobDetailResponse in4JD = getIn4OfJD(dataOfJD);
            String titleText = in4JD.getTitle() != null ? in4JD.getTitle().toString() : "";
            String skillsText = in4JD.getSkills() != null ? String.join(", ", in4JD.getSkills()) : "";
            String dataForAI = String.format(
                    "Position: %s\nTitle: %s\nCategory: %s\nSkills: %s\nSalary: %s - %s\nLocation: %s\nDescription: %s",
                    in4JD.getPosition(),
                    titleText,
                    in4JD.getCategoryName(),
                    skillsText,
                    in4JD.getSalaryMin(),
                    in4JD.getSalaryMax(),
                    in4JD.getLocation(),
                    in4JD.getDescription()
            );
            String resultOdAI = aiService.Ai_OF_SKILLBRIDGE(dataForAI, 1);
            System.out.println("Kết quả trả về " + resultOdAI);

        } catch (Exception e) {
        e.printStackTrace();
        throw new RuntimeException(ErrorCode.AI_EXITS.getMessage(), e);
         }
        finally {
            System.out.println("Đã chạy xong chức năng đánh phân tích JD");
        }
    }




}
