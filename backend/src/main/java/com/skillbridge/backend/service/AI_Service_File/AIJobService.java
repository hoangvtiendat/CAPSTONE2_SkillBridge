package com.skillbridge.backend.service.AI_Service_File;

import com.skillbridge.backend.config.CustomUserDetails;
import com.skillbridge.backend.dto.request.SemanticSearchRequest;
import com.skillbridge.backend.dto.request.SkillRequest;
import com.skillbridge.backend.dto.response.*;
import com.skillbridge.backend.entity.Candidate;
import com.skillbridge.backend.entity.Job;
import com.skillbridge.backend.entity.User;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.repository.CategoryRepository;
import com.skillbridge.backend.repository.JobRepository;
import com.skillbridge.backend.enums.ModerationStatus;
import com.skillbridge.backend.enums.JobStatus;
import com.skillbridge.backend.service.CandidateService;
import com.skillbridge.backend.service.MailService;
import com.skillbridge.backend.service.NotificationService;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.skillbridge.backend.utils.SecurityUtils;

import java.util.*;
import java.util.stream.Collectors;


@Service
public class AIJobService {
    @Autowired
    JobRepository jobRepository;
    @Autowired
    AiService aiService;
    @Autowired
    NotificationService notificationService;
    @Autowired
    ObjectMapper objectMapper;
    @Autowired
    CategoryRepository categoryRepository;
    @Autowired
    CandidateService candidateService;
    @Autowired
    SecurityUtils securityUtils;
    /// Lấy nội dung vector để so sánh
    public String getJobComparisonResponse(String jobId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new AppException(ErrorCode.JOB_NOT_FOUND));

        List<Object[]> skillData = jobRepository.findSkillNamesByJobIds(List.of(jobId));
        List<String> skills = skillData.stream()
                .map(obj -> (String) obj[1])
                .toList();
        try{
        String categoryName = (job.getCategory() == null ? "" : job.getCategory().getName());
        String companyName = (job.getCompany().getName() == null ? "" : job.getCompany().getName());
        String skillsString = String.join(" ", skills);
        String dataForAI = String.format(
                "Position: %s\nTitle: %s\nCategory: %s\nSkills: %s\nSalary: %s - %s\nLocation: %s\nDescription: %s",
                job.getPosition(),
                job.getTitle(),
                companyName,
                categoryName,
                skillsString,
                job.getSalaryMin(),
                job.getSalaryMax(),
                job.getLocation(),
                job.getDescription());
            return dataForAI;

        } catch (Exception e) {
            throw new RuntimeException(ErrorCode.UNCATEGORIZED_EXCEPTION.getMessage());
        }
    }
    //Hàm tính toán Vector
    private double calculateCosineSimilarity(float[] vectorA, float[] vectorB) {
        if (vectorA.length != vectorB.length) return 0.0;

        double dotProduct = 0.0;
        double normA = 0.0;
        double normB = 0.0;

        for (int i = 0; i < vectorA.length; i++) {
            dotProduct += (double) vectorA[i] * vectorB[i];
            normA += Math.pow(vectorA[i], 2);
            normB += Math.pow(vectorB[i], 2);
        }

        if (normA == 0 || normB == 0) return 0.0;

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
    /// hàm check bài spam của công ty
    public int checkSpamJd_of_company(String idOfCompany, String idOfJob ,float[] newJobVector) {
        try {
            String bestMathId = null;
            double maxSimilarity = 0.0;
            List<Object[]> rawResults = jobRepository.listAllVectorsByCompanyIdExceptCurrent(idOfCompany,idOfJob, JobStatus.OPEN.name());

            System.out.println("Size of rawResults: " + (rawResults != null ? rawResults.size() : 0));
            System.out.println("All vector " + rawResults);

            if (rawResults == null || rawResults.isEmpty()) {
                return 1;
            }

            for (Object[] row : rawResults) {
                Object vectorData = row[1];
                if (vectorData == null) continue;

                String vectorJson;
                if (vectorData instanceof byte[]) {
                    vectorJson = new String((byte[]) vectorData);
                } else {
                    vectorJson = vectorData.toString();
                }

                float[] existingVector = objectMapper.readValue(vectorJson, float[].class);

                double similarity = calculateCosineSimilarity(newJobVector, existingVector);
                if (similarity > maxSimilarity){
                    maxSimilarity = similarity;
                    bestMathId = (String) row[0];
                }

            }
            System.out.println("maxSimilarity" + maxSimilarity);
            if (maxSimilarity >= 0.45 && maxSimilarity < 0.6)
            {return 2;}
            if (maxSimilarity >= 0.6){
            ///  Lây detail của JD mới
            String detailNewJD = getJobComparisonResponse(idOfJob);
            ///  Lấy detail cảu JD cũ
            String detailOldJD = getJobComparisonResponse(bestMathId);
            String data = "<JD1>\n" + detailNewJD + "\n</JD1>\n\n" +
                        "<JD2>\n" + detailOldJD + "\n</JD2>";
            String checkSpam = aiService.Ai_OF_SKILLBRIDGE(data, 2);
            System.out.println("checkSpam"+ checkSpam);
            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode jsonNode = objectMapper.readTree(checkSpam);
            System.out.println("typeJSonnode" + jsonNode.getNodeType());

            Boolean checkSpamJD = jsonNode.get("spam").asBoolean();
            if(checkSpamJD == true){
                return 3;
            }
            else {
                return 1;
            }
            }

            return 1;

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Lỗi khi kiểm tra vector: " + e.getMessage());
        }
        finally {
            System.out.println("Đã chạy xong chức năng check spam ");
        }
    }    ///  Lấy thông tin cụ thể của bài đăng của JD
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

        try {
            Job job = jobRepository.findById(dataOfJD)
                    .orElseThrow(() -> new AppException(ErrorCode.JOB_NOT_FOUND));
            String companyId = job.getCompany().getId();
            System.out.println("id: " + dataOfJD);
            Optional<User> userOptional = jobRepository.findUserByJobAndCompany(dataOfJD, companyId);
            System.out.println("getIdOfReceiver: " + userOptional);
            System.out.println("dataOfJD: " + dataOfJD);
            User receiver = userOptional.get();
            System.out.println("receiver (Email): " + receiver.getEmail());

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
            /// 　String > json
            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode jsonNode = objectMapper.readTree(resultOdAI);
            /// Bóc tách dữ liệu nèdd
            Boolean checkResultAI = jsonNode.get("isApproved").asBoolean();
            String subject = "Thông báo duyệt bài đăng";
            String messageBody= "";
            if (checkResultAI == false) {
                String reason = jsonNode.get("reason").asText();
                List<String> flaggedKeywordsList = new ArrayList<>();
                JsonNode flaggedKeywordsNode = jsonNode.get("flaggedKeywords");
                if (flaggedKeywordsNode != null && flaggedKeywordsNode.isArray()) {
                    for (JsonNode keyword : flaggedKeywordsNode) {
                        flaggedKeywordsList.add(keyword.asText());
                    }
                }
                String keywordsString = flaggedKeywordsList.isEmpty()
                        ? "Không phát hiện từ khóa cụ thể"
                        : String.join(", ", flaggedKeywordsList);
                 messageBody = String.format(
                        "<div style='font-family: Arial; padding: 20px; border: 1px solid #ddd; border-radius: 8px;'>" +
                                "<h2 style='color: #dc3545;'>Bài đăng không được phê duyệt</h2>" +
                                "<p>Chào <b>%s</b>,</p>" +
                                "<p>Bài đăng: <b>%s</b> của bạn không vượt qua được kiểm duyệt tự động.</p>" +
                                "<p><b>Lý do:</b> %s</p>" +
                                "<p><b>Từ khóa vi phạm:</b> <span style='color: #dc3545;'>%s</span></p>" +
                                "<p>Vui lòng chỉnh sửa lại nội dung để phù hợp với tiêu chuẩn cộng đồng.</p>" +
                                "<br><p>Trân trọng,<br>SkillBridge AI Moderator</p></div>",
                        receiver.getName(), job.getTitle(), reason, keywordsString
                );
                job.setModerationStatus(ModerationStatus.RED);

                notificationService.createNotification(
                        receiver,
                        null,
                        subject,
                        messageBody,
                        "JOB_MODERATION_FAILED",
                        "/detail-jd/dataOfJD",
                        true

                );
            }
            else{
                float[] vectorOFFJ = job.getVectorEmbedding();
                int result = checkSpamJd_of_company(job.getCompany().getId(),dataOfJD ,vectorOFFJ);
                System.out.println("ketquaspamtrave" + result);
                if (result == 1) {
                    messageBody = String.format(
                            "<div style='font-family: Arial; padding: 20px; border: 1px solid #ddd; border-radius: 8px;'>" +
                                    "<h2 style='color: #28a745;'>Chúc mừng! Bài đăng đã được phê duyệt</h2>" +
                                    "<p>Chào <b>%s</b>,</p>" +
                                    "<p>Bài đăng: <b>%s</b> của bạn đã vượt qua quy trình kiểm duyệt tự động và hiện đã được hiển thị trên hệ thống SkillBridge.</p>" +
                                    "<p><b>Trạng thái:</b> <span style='color: #28a745; font-weight: bold;'>Đã phê duyệt (Active)</span></p>" +
                                    "<p>Bạn có thể theo dõi lượt ứng tuyển và quản lý bài đăng ngay trong trang quản trị của mình.</p>" +
                                    "<p>Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ của SkillBridge!</p>" +
                                    "<br><p>Trân trọng,<br><b>SkillBridge AI Moderator</b></p></div>",
                            receiver.getName(),
                            titleText);
                    job.setModerationStatus(ModerationStatus.GREEN);
                    job.setStatus(JobStatus.OPEN);
                }
                else if(result == 2){
                    messageBody = String.format(
                            "<div style='font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ffeeba; border-radius: 8px; background-color: #fff3cd;'>" +
                                    "<h2 style='color: #856404;'>Thông báo trạng thái bài đăng</h2>" +
                                    "<p>Chào <b>%s</b>,</p>" +
                                    "<p>Hệ thống kiểm duyệt tự động nhận thấy bài đăng: <b>%s</b> của bạn có nội dung tương đồng với một số dữ liệu hiện có.</p>" +
                                    "<p style='background-color: #ffffff; padding: 10px; border-radius: 5px; border-left: 5px solid #ffc107;'>" +
                                    "   <b>Trạng thái:</b> <span style='color: #856404; font-weight: bold;'>Đang chờ quản trị viên phê duyệt (Pending Review)</span>" +
                                    "</p>" +
                                    "<p>Để đảm bảo chất lượng nội dung tốt nhất cho cộng đồng SkillBridge, bài đăng của bạn đã được chuyển đến <b>Quản trị viên hệ thống</b> để xem xét thủ công.</p>" +
                                    "<p><i>Vui lòng kiên nhẫn chờ trong giây lát. Hệ thống sẽ gửi thông báo ngay khi quá trình duyệt hoàn tất.</i></p>" +
                                    "<br><p>Trân trọng,<br><b>Đội ngũ SkillBridge AI Moderator</b></p></div>",
                            receiver.getName(),
                            titleText
                    );
                    job.setModerationStatus(ModerationStatus.YELLOW);
                }
                else if (result == 3) {
                    messageBody = String.format(
                            "<div style='font-family: Arial; padding: 20px; border: 1px solid #ddd; border-radius: 8px;'>" +
                                    "<h2 style='color: #dc3545;'>Bài đăng bị đánh giá là Spam</h2>" +
                                    "<p>Chào <b>%s</b>,</p>" +
                                    "<p>Bài đăng: <b>%s</b> của bạn không vượt qua được kiểm duyệt tự động vì có dấu hiệu spam.</p>" +
                                    "<p><b>Trạng thái:</b> <span style='color: #dc3545;'>Đang chờ duyệt thủ công</span></p>" +
                                    "<p><b>Lý do:</b> Nội dung quá tương đồng với các bài đăng trước đó của công ty.</p>" +
                                    "<p>Vui lòng hạn chế đăng tải các nội dung trùng lặp để đảm bảo tiêu chuẩn cộng đồng.</p>" +
                                    "<br><p>Trân trọng,<br>SkillBridge AI Moderator</p></div>",
                            receiver.getName(), titleText);
                    job.setModerationStatus(ModerationStatus.RED);

                }
                if (!messageBody.isEmpty()) {
                    jobRepository.save(job);

                    notificationService.createNotification(
                            receiver,
                            null,
                            subject,
                            messageBody,
                            "JOB_MODERATION_FAILED",
                            "/detail-jd/dataOfJD",
                            true
                    );
                }
            }


        } catch (Exception e) {
        e.printStackTrace();
        throw new RuntimeException(ErrorCode.AI_EXITS.getMessage(), e);
         }
        finally {
            System.out.println("Đã chạy xong chức năng đánh phân tích JD");
        }
    }

    ///  Tìm Job theo ngữ nghĩa
    public List<JobSemanticSearchResponse> findJobBySemanticSearch(String requestOfCandidate) {
        ObjectMapper objectMapper = new ObjectMapper();

        try {
            String idOfUser = securityUtils.getCurrentUserId();

            UpdateCandidateCvResponse cv = candidateService.getCv(idOfUser);
            System.out.println("cvNe" + cv);
            System.out.println(cv);
            if (cv == null) {
                throw new RuntimeException(ErrorCode.NOT_FOUND_DATA_CV.getMessage());
            }
            List<SkillRequest> skills = new ArrayList<>();

            if (cv.getSkills() != null) {
                for (CandidateSkillResponse s : cv.getSkills()) {
                    SkillRequest skill = new SkillRequest();
                    skill.setName(s.getSkillName());
                    skill.setCategoryId(s.getSkillId());
                    skills.add(skill);
                }
            }
            System.out.println("SkillList " + skills);
            List<dataDetailCanDiadateForAIReponse> getImportantDataOfCandidate = new ArrayList<>();

            dataDetailCanDiadateForAIReponse data = dataDetailCanDiadateForAIReponse.builder()
                    .category(cv.getCategory())
                    .location(cv.getAddress())
                    .degrees(cv.getDegrees())
                    .skills(skills)
                    .build();

            getImportantDataOfCandidate.add(data);

            /// Lấy dữ liệu danh sách category của hệ thống
            System.out.println("Hàm lấy Categories");
            List<CategoryResponse> getAllCategories = categoryRepository.findActiveCategories();

            String jsonStringCategory = objectMapper.writeValueAsString(getAllCategories);
            /// bóc tách dữ liệu
            String jsonStringCandidate = objectMapper.writeValueAsString(getImportantDataOfCandidate);
            String promptTemplate = """
                    Bạn là hệ thống AI phân tích dữ liệu nhân sự cốt lõi của ứng dụng SkillBridge. 
                    ... (Nội dung Prompt của bạn) ...
                    [DANH SÁCH CATEGORY HỆ THỐNG]: %s
                    [DỮ LIỆU CV HIỆN TẠI]: %s
                    [YÊU CẦU TỪ NGƯỜI DÙNG]: "%s"
                    """;
            String requstForAI = String.format(promptTemplate,
                    jsonStringCategory,
                    jsonStringCandidate,
                    requestOfCandidate
            );

            String aiResponse = aiService.Ai_OF_SKILLBRIDGE(requstForAI, 3);
            System.out.println("aiResponse " + aiResponse);
            JsonNode rootNode = objectMapper.readTree(aiResponse);
            System.out.println("requstForAI\n" + requstForAI);

            String categoryName, city;
            Long salaryExpect;
            List<String> skillIds = new ArrayList<>();
            List<String> degreeNames = new ArrayList<>();

            int type = rootNode.get("typeTraVe").asInt();
            System.out.println("typeTraVe " + type);
            System.out.println("rootNode" + rootNode);

            categoryName = (rootNode.has("category_name") && !rootNode.get("category_name").asText().isEmpty())
                    ? rootNode.get("category_name").asText() : null;

            city = (rootNode.has("city") && !rootNode.get("city").asText().isEmpty())
                    ? rootNode.get("city").asText() : null;

            List<String> skillsName = new ArrayList<>();
            JsonNode skillsNode = rootNode.get("skill_names");
            if (skillsNode != null && skillsNode.isArray()) {
                for (JsonNode skill : skillsNode) {
                    String s = skill.asText();
                    if (!s.isEmpty()) skillsName.add(s);
                }
            }

            boolean hasSkills = !skillsName.isEmpty();
            salaryExpect = rootNode.get("salary_expect").asLong();

            List<Job> jobsFromDb = new ArrayList<>();
            List<String> querySkills = hasSkills ? skillsName : Collections.singletonList("");

            if (type == 0) {
                System.out.println("querySkills " + querySkills);
                System.out.println("hasSkills " + hasSkills);
                System.out.println("skillsName " + skillsName);
                System.out.println("salaryExpect " + salaryExpect);

                jobsFromDb = jobRepository.findJobsByRequirements(
                        JobStatus.OPEN.name(),
                        city,
                        categoryName,
                        querySkills,
                        hasSkills,
                        salaryExpect
                );
            } else if (type == 1) {
                jobsFromDb = jobRepository.findJobsByRequirements_Not_sameCategory(
                        JobStatus.OPEN.name(),
                        city,
                        categoryName,
                        querySkills,
                        hasSkills,
                        salaryExpect
                );
            } else if (type == 2) {
                System.out.println("AI không tìm thấy ngành phù hợp.");
                return new ArrayList<>();
            }

            System.out.println("Kết quả tìm kiếm: " + jobsFromDb.size() + " jobs found từ DB.");

            List<JobSemanticSearchResponse> resultList = new ArrayList<>();
            // lấy from cảu cty
            for (Job job : jobsFromDb) {
                JobResponse.CompanyDTO companyDTO = null;
                if (job.getCompany() != null) {
                    companyDTO = JobResponse.CompanyDTO.builder()
                            .id(job.getCompany().getId())
                            .name(job.getCompany().getName())
                            .logoUrl(job.getCompany().getImageUrl())
                            .build();
                }
            ///  láy ategory
                JobResponse.CategoryDTO categoryDTO = null;
                if (job.getCategory() != null) {
                    categoryDTO = JobResponse.CategoryDTO.builder()
                            .id(job.getCategory().getId())
                            .name(job.getCategory().getName())
                            .build();
                }
                /// Lấy skill của Job
                List<JobResponse.JobSkillDTO> skillDTOList = new ArrayList<>();
                if(job.getJobSkills() != null) {
                    job.getJobSkills().forEach(jobSkill ->{
                                JobResponse.JobSkillDTO skillDTO = JobResponse.JobSkillDTO.builder()
                                        .name(jobSkill.getSkill().getName())
                                        .build();
                                skillDTOList.add(skillDTO);
                            });
                }
                ///  xuẩt kết quả trả về
                JobSemanticSearchResponse dto = JobSemanticSearchResponse.builder()
                        .id(job.getId())
                        .position(job.getPosition())
                        .description(job.getDescription())
                        .location(job.getLocation())
                        .status(job.getStatus() != null ? job.getStatus().name() : null)
                        .salaryMin(job.getSalaryMin())
                        .salaryMax(job.getSalaryMax())
                        .company(companyDTO)
                        .category(categoryDTO)
                        .skills(skillDTOList)
                        .vectorEmbedding(job.getVectorEmbedding())
                        .build();

                resultList.add(dto);
            }

            return resultList;

        } catch (Exception e) {
            throw new RuntimeException("AI error", e);
        } finally {
            System.out.println("findJobBySemanticSearch đã chạy xong");
        }
    }
}
