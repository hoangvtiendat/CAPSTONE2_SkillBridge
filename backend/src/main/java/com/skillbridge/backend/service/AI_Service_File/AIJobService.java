package com.skillbridge.backend.service.AI_Service_File;

import com.skillbridge.backend.dto.request.SkillRequest;
import com.skillbridge.backend.dto.response.*;
import com.skillbridge.backend.entity.*;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.repository.*;
import com.skillbridge.backend.enums.ModerationStatus;
import com.skillbridge.backend.enums.JobStatus;
import com.skillbridge.backend.service.CandidateService;
import com.skillbridge.backend.service.EmbeddingService;
import com.skillbridge.backend.service.NotificationService;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.skillbridge.backend.utils.SecurityUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;


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


    @Autowired
    EmbeddingService embeddingService;

    @Autowired
    JD_SimilaritiesRepository jdSimilaritiesRepository;

    @Autowired
    JobRejectionLogRepository jobRejectionLogRepository;

    LocalDate date = LocalDate.now();
///  ========= Các Hàm dùng để thực hiện chức năng Đánh giá cơ thế đèn giao thông =========

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
    ///  Hàm lấy ID của SPAMJD
    public List<String> getListSPamJD() {
        List<JD_Similarities> jdTargets = jdSimilaritiesRepository.listTargetJobs();
        System.out.println("da chay getListSPamJD");
        return jdTargets.stream()
                .map(job -> job.getTarget_jd_id().getId().toString())
                .collect(Collectors.toList());
    }
    public void createTwoJDOfSpam(Job Source_jd, Job Target_jd, Double CosineSimilarity) {
        JD_Similarities AddJDSpamAndOldJD = new JD_Similarities();
        AddJDSpamAndOldJD.setSource_jd_id(Source_jd);
        AddJDSpamAndOldJD.setTarget_jd_id(Target_jd);
        AddJDSpamAndOldJD.setSimilarity(CosineSimilarity);
        jdSimilaritiesRepository.save(AddJDSpamAndOldJD);
    }
    ///  Hàm lấy các Danh sách JD bị trùng
    public Map<String, Object> getJDTarget(String jDSpam_id) {
        System.out.println("jDSpam_id: " + jDSpam_id);
        Job jobTarget = jdSimilaritiesRepository.findTargetJobBySourceId(jDSpam_id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy dữ liệu Job trùng lặp cho ID: " + jDSpam_id));

        Job jobSpam = jobRepository.findById(jDSpam_id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy dữ liệu Job gốc (Spam) cho ID: " + jDSpam_id));

        JobResponse jdSpamResponse = mapToJobResponse(jobSpam);
        JobResponse targetJDResponse = mapToJobResponse(jobTarget);

        Map<String, Object> data = new HashMap<>();
        data.put("targetJD", targetJDResponse);
        data.put("jdSpam", jdSpamResponse);

        return data;
    }

    private JobResponse mapToJobResponse(Job job) {
        return JobResponse.builder()
                .id(job.getId())
                .position(job.getPosition())
                .description(job.getDescription())
                .location(job.getLocation())
                .status(job.getStatus().name())
                .salaryMin(job.getSalaryMin())
                .salaryMax(job.getSalaryMax())
                .title(job.getTitle())
                .startDate(LocalDate.from(job.getStartDate()))
                .endDate(LocalDate.from(job.getEndDate()))
                .company(JobResponse.CompanyDTO.builder()
                        .id(job.getCompany().getId())
                        .name(job.getCompany().getName())
                        .logoUrl(job.getCompany().getImageUrl())
                        .build())

                // Mapping Category
                .category(job.getCategory() != null ? JobResponse.CategoryDTO.builder()
                        .id(job.getCategory().getId())
                        .name(job.getCategory().getName())
                        .build() : null)

                // Mapping danh sách Skills
                .skills(job.getJobSkills() != null ? job.getJobSkills().stream()
                        .map(skill -> JobResponse.JobSkillDTO.builder()
                                .name(skill.getSkill().getName())
                                .required(true)
                                .build())
                        .toList() : null)
                .build();
    }
    /// hàm check bài spam của công ty
    public int checkSpamJd_of_company(String idOfCompany, String idOfJob ,float[] newJobVector) {
        try {
            String bestMathId = null;
            double maxSimilarity = 0.0;
            List<String> statuses = List.of(JobStatus.OPEN.name(), JobStatus.NOT_STARTED.name(), JobStatus.PENDING.name());

            List<Object[]> rawResults = jobRepository.listAllVectorsByCompanyIdExceptCurrent(
                    idOfCompany,
                    idOfJob,
                    statuses
            );

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
            ///  Lấy ID của JD spam với JD hiện tại
            Job get_Source_jd_id = jobRepository.getReferenceById(bestMathId);
            Job get_Target_jd_id = jobRepository.getReferenceById(idOfJob);
            ///

            System.out.println("maxSimilarity" + maxSimilarity);
            if (maxSimilarity >=  0.5 && maxSimilarity < 0.70)
            {
               createTwoJDOfSpam(get_Source_jd_id,get_Target_jd_id,maxSimilarity);
                return 2;
            }
            if (maxSimilarity >= 0.70){
            ///  Lây detail của JD mới
            String detailNewJD = getJobComparisonResponse(idOfJob);
            ///  Lấy detail cảu JD cũ
            String detailOldJD = getJobComparisonResponse(bestMathId);
            String data = "<JD1>\n" + detailNewJD + "\n</JD1>\n\n" +
                        "<JD2>\n" + detailOldJD + "\n</JD2>\n\n" +
                        "<VecTor>\n" + maxSimilarity + "\n<VecTor>";
            String checkSpam = aiService.Ai_OF_SKILLBRIDGE(data, 2);
            System.out.println("checkSpam"+ checkSpam);
            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode jsonNode = objectMapper.readTree(checkSpam);
            System.out.println("typeJSonnode" + jsonNode.getNodeType());

            Boolean checkSpamJD = jsonNode.get("spam").asBoolean();
            if(checkSpamJD == true){
                ///  Lưu các JD Là bài Spam
                createTwoJDOfSpam(get_Source_jd_id,get_Target_jd_id,maxSimilarity);
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
    public void ai_Check_Approval (String idJD){
        JobStatus finalStatus = null;

        try {

            Job job = jobRepository.findById(idJD)
                    .orElseThrow(() -> new AppException(ErrorCode.JOB_NOT_FOUND));
            String companyId = job.getCompany().getId();
            Optional<User> userOptional = jobRepository.findUserByJobAndCompany(idJD, companyId);
            User receiver = userOptional.get();
            String notificationForCompany = job.getCompany().getId();
            ///  Lấy Ngày kết thúc && Ngày bắt đầu
            LocalDate startDate = LocalDate.from(job.getStartDate());
            LocalDate endDate = LocalDate.from(job.getEndDate());
            LocalDate today = LocalDate.from(LocalDateTime.now());


            JobDetailResponse in4JD = getIn4OfJD(idJD);
            String titleText = in4JD.getTitle() != null ? in4JD.getTitle().toString() : "N/A";
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


            ///  biến đôi mảng trành String



            /// Ai đánh giá
            String resultOdAI = aiService.Ai_OF_SKILLBRIDGE(dataForAI, 1);
            /// 　String > json
            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode jsonNode = objectMapper.readTree(resultOdAI);
            /// Bóc tách dữ liệu nèdd

            boolean checkResultAI = jsonNode.path("isApproved").asBoolean(false);
            int count = jobRejectionLogRepository.deleteByJobId(idJD);

            String deletedRows = String.valueOf(count);

            if (!deletedRows.equals("0")) {
                System.out.println("Đã xóa thành công " + deletedRows + " dữ liệu!");
            } else {
                System.out.println("Không có dữ liệu nào khớp với idJD để xóa.");
            }
            String subject = "Thông báo duyệt bài đăng";
            String messageBody= "";
            String other_possion = jsonNode.path("other_position").asText();
            System.out.println("resultOdAI" + resultOdAI);
            job.setOtherPosition(other_possion);
            if (checkResultAI == false) {
                String reason = jsonNode.get("reason").asText();
                List<String> flaggedKeywordsList = new ArrayList<>();
                JsonNode flaggedKeywordsNode = jsonNode.get("flaggedKeywords");

                JobRejectionLog jobRejectionLog = new JobRejectionLog();
                jobRejectionLog.setJobId(idJD);
                jobRejectionLog.setMessage(reason);
                jobRejectionLogRepository.save(jobRejectionLog);
                if (flaggedKeywordsNode != null && flaggedKeywordsNode.isArray()) {
                    for (JsonNode keyword : flaggedKeywordsNode) {
                        flaggedKeywordsList.add(keyword.asText());
                    }
                }
                String keywordsString = flaggedKeywordsList.isEmpty()
                        ? "Không phát hiện từ khóa cụ thể"
                        : String.join(", ", flaggedKeywordsList);
                messageBody = String.format(
                        "BÀI ĐĂNG BỊ TỪ CHỐI\n\n" +
                                "Chào %s,\n\n" +
                                "Bài đăng \"%s\" của bạn không vượt qua được quy trình kiểm duyệt tự động.\n\n" +
                                "Lý do: %s\n" +
                                "Từ khóa vi phạm: %s\n\n" +
                                "Vui lòng chỉnh sửa lại nội dung để phù hợp với tiêu chuẩn cộng đồng trước khi đăng tải lại.\n\n" +
                                "Trân trọng,\n" +
                                "SkillBridge AI Moderator",
                        receiver.getName(),
                        job.getPosition(),
                        reason,
                        keywordsString
                );
                job.setModerationStatus(ModerationStatus.RED);
                job.setStatus(JobStatus.LOCK);
                finalStatus = JobStatus.LOCK;
                notificationService.notificationForAiCheckTrafficLight(
                        receiver,
                        null,
                        idJD,
                        finalStatus,
                        subject,
                        messageBody,
                        true,
                        "JOB_MODERATION_FAILED",
                        notificationForCompany

                );
            }

            else{
                float[] vectorOFFJ = job.getVectorEmbedding();
                int result = checkSpamJd_of_company(job.getCompany().getId(),idJD ,vectorOFFJ);
                System.out.println("ketquaspamtrave" + result);
                if (result == 1) {
                    messageBody = String.format(
                            "BÀI ĐĂNG ĐÀ HOẠT ĐỘNG\n\n" +
                                    "Chào %s,\n\n" +
                                    "Chúc mừng! Tin tuyển dụng %s của bạn đã được phê duyệt và hiển thị công khai trên hệ thống.\n\n" +
                                    "Trạng thái: Đã phê duyệt (Active)\n" +
                                    "Bây giờ ứng viên có thể tìm thấy và ứng tuyển vào vị trí này.\n\n" +
                                    "Trân trọng,\n" +
                                    "SkillBridge AI Moderator",
                            receiver.getName(),
                            job.getPosition()
                    );
                    if (today.isBefore(startDate)) {
                        System.out.println("ChuaDenNgay");
                        finalStatus = JobStatus.NOT_STARTED;
                    } else if (today.isAfter(endDate)) {
                        System.out.println("DongNgay");
                        finalStatus = JobStatus.CLOSED;
                    } else {
                        System.out.println("MoNgay");
                        finalStatus = JobStatus.OPEN;
                    }

                    job.setStatus(finalStatus);
                    job.setModerationStatus(ModerationStatus.GREEN);
                }
                /// /////// Return 3 nếu đó là bài SPAM (dùng AI đánh giá ) --- Return 2 nếu đó là bài có độ tương đồng vector (ko liên quan đến AI)

                else if(result == 2){
                    messageBody = String.format(
                            "THÔNG BÁO TRẠNG THÁI BÀI ĐĂNG\n\n" +
                                    "Chào %s,\n\n" +
                                    "Hệ thống kiểm duyệt tự động nhận thấy bài đăng: \"%s\" của bạn có nội dung tương đồng với một số dữ liệu hiện có.\n\n" +
                                    "Trạng thái: Đang chờ quản trị viên phê duyệt (Pending Review)\n\n" +
                                    "Để đảm bảo chất lượng nội dung tốt nhất cho cộng đồng SkillBridge, bài đăng của bạn đã được chuyển đến Quản trị viên hệ thống để xem xét thủ công.\n\n" +
                                    "Vui lòng kiên nhẫn chờ trong giây lát. Hệ thống sẽ gửi thông báo ngay khi quá trình duyệt hoàn tất.\n\n" +
                                    "Trân trọng,\n" +
                                    "Đội ngũ SkillBridge AI Moderator",
                            receiver.getName(),
                            job.getPosition()
                    );
                    job.setModerationStatus(ModerationStatus.YELLOW);
                    finalStatus = JobStatus.PENDING;


                }
                else if (result == 3) {
                     messageBody = String.format(
                            "TỪ CHỐI ĐĂNG BÀI - VI PHẠM CHÍNH SÁCH\n\n" +
                                    "Chào %s,\n\n" +
                                    "Rất tiếc phải thông báo rằng tin tuyển dụng \"%s\" của bạn đã không được phê duyệt trên hệ thống.\n\n" +
                                    "Trạng thái: Bị từ chối (Hệ thống phát hiện dấu hiệu Spam / Trùng lặp)\n" +
                                    "Qua quá trình kiểm duyệt tự động, hệ thống nhận thấy nội dung bài đăng của bạn có dấu hiệu vi phạm tiêu chuẩn cộng đồng hoặc trùng lặp dữ liệu. Để đảm bảo chất lượng của nền tảng, bài đăng này đã bị gỡ bỏ.\n\n" +
                                    "Nếu bạn cho rằng đây là một sự nhầm lẫn, vui lòng phản hồi lại email này để đội ngũ quản trị viên hỗ trợ kiểm tra lại.\n\n" +
                                    "Trân trọng,\n" +
                                    "Đội ngũ SkillBridge",
                            receiver.getName(),
                            job.getPosition()
                    );
                    job.setModerationStatus(ModerationStatus.RED);
                    job.setStatus(JobStatus.LOCK);
                    finalStatus = JobStatus.LOCK;
                }
                if (!messageBody.isEmpty()) {
                    jobRepository.save(job);

                    notificationService.notificationForAiCheckTrafficLight(
                            receiver,
                            null,
                            idJD,
                            finalStatus,
                            subject,
                            messageBody,
                            true,
                            "JOB_MODERATION_FAILED",
                            notificationForCompany
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
    @Transactional
    public List<JobSemanticSearchResponse> findJobBySemanticSearch(String requestOfCandidate)
    {
        ObjectMapper objectMapper = new ObjectMapper();

        try {
            String idOfUser = securityUtils.getCurrentUserId();
            UpdateCandidateCvResponse cv = candidateService.getCV_searchsenematic(idOfUser);


            System.out.println("CV: " + cv);

            List<SkillRequest> skills = new ArrayList<>();
            String candidateCategory = null;
            String candidateLocation = null;
            List<DegreeResponse> candidateDegrees = new ArrayList<>();

            if (cv != null) {
                if (cv.getSkills() != null) {
                    for (CandidateSkillResponse s : cv.getSkills()) {
                        SkillRequest skill = new SkillRequest();
                        skill.setName(s.getSkillName());
                        skill.setCategoryId(s.getSkillId());
                        skills.add(skill);
                    }
                }
                candidateCategory = cv.getCategory();
                candidateLocation = cv.getAddress();
                if (cv.getDegrees() != null) {
                    candidateDegrees = cv.getDegrees();
                }
            }

            dataDetailCanDiadateForAIReponse data = dataDetailCanDiadateForAIReponse.builder()
                    .category(candidateCategory)
                    .location(candidateLocation)
                    .degrees(candidateDegrees)
                    .skills(skills)
                    .build();

            List<dataDetailCanDiadateForAIReponse> getImportantDataOfCandidate = Collections.singletonList(data);

            List<CategoryResponse> getAllCategories = categoryRepository.findActiveCategories();
            String jsonStringCategory = objectMapper.writeValueAsString(getAllCategories);
            String jsonStringCandidate = objectMapper.writeValueAsString(getImportantDataOfCandidate);

            String promptTemplate = """
                    Bạn là hệ thống AI phân tích dữ liệu nhân sự cốt lõi của ứng dụng SkillBridge. 
                    --- BẮT ĐẦU DỮ LIỆU ĐẦU VÀO ---                 
                    + [DANH SÁCH CATEGORY HỆ THỐNG]: %s  
                    + [DỮ LIỆU CV HIỆN TẠI]: %s 
                    + [YÊU CẦU TỪ NGƯỜI DÙNG]: "%s"  
                    """;

            String requestForAI = String.format(promptTemplate, jsonStringCategory, jsonStringCandidate, requestOfCandidate);
            String aiResponse = aiService.Ai_OF_SKILLBRIDGE(requestForAI, 3);
            System.out.println("aiResponse: " + aiResponse);

            JsonNode rootNode = objectMapper.readTree(aiResponse);
            // LẤY CATEGORY
            String categoryName = (rootNode.has("category_name") && !rootNode.get("category_name").asText().isEmpty() && !"null".equalsIgnoreCase(rootNode.get("category_name").asText()))
                    ? rootNode.get("category_name").asText() : null;

            // LẤY CITY
            String cityRaw = (rootNode.has("city") && !rootNode.get("city").asText().isEmpty() && !"null".equalsIgnoreCase(rootNode.get("city").asText()))
                    ? rootNode.get("city").asText() : null;

            String loc1 = null;
            String loc2 = null;
            String loc3 = null;

            if (cityRaw != null) {
                String[] parts = cityRaw.split(",");
                if (parts.length > 0 && !parts[0].trim().isEmpty()) {
                    loc1 = parts[0].trim();
                }
                if (parts.length > 1 && !parts[1].trim().isEmpty()) {
                    loc2 = parts[1].trim();
                }
                if (parts.length > 2 && !parts[2].trim().isEmpty()) {
                    loc3 = parts[2].trim();
                }
            }

            // LẤY MỨC LƯƠNG
            Long salaryExpect = rootNode.path("salary_expect").isNull() ? null : rootNode.path("salary_expect").asLong();

            // LẤY VECTOR QUERY
            String getQueryEmbedding = rootNode.path("search_query").asText("");
            // Lấy position
            String positionVi = null;
            String positionEn = null;

            JsonNode jobPositionNode = rootNode.get("job_position");

            if (jobPositionNode != null && !jobPositionNode.isNull()) {

                JsonNode viNode = jobPositionNode.get("vi");
                JsonNode enNode = jobPositionNode.get("en");

                if (viNode != null
                        && !viNode.isNull()
                        && !viNode.asText().trim().isEmpty()
                        && !"null".equalsIgnoreCase(viNode.asText())) {

                    positionVi = viNode.asText()
                            .toLowerCase()
                            .replace(" ", "")
                            .replace("-", "")
                            .replace("_", "");
                }

                if (enNode != null
                        && !enNode.isNull()
                        && !enNode.asText().trim().isEmpty()
                        && !"null".equalsIgnoreCase(enNode.asText())) {

                    positionEn = enNode.asText()
                            .toLowerCase()
                            .replace(" ", "")
                            .replace("-", "")
                            .replace("_", "");
                }
            }
            // Lấy search_query
            String StringOfsearch_query = rootNode.path("search_query").asText("");



            // GỌI REPOSITORY
            List<Job> jobsFromDb = jobRepository.findJobsByRequirements(
                    JobStatus.OPEN.name(),
                    loc1,
                    loc2,
                    loc3,
                    categoryName,
                    salaryExpect,
                    positionVi,
                    positionEn
            );
            System.out.println("jobsFromDb: " + jobsFromDb);
            System.out.println("--> ẢI 1 (SQL): " + jobsFromDb.size() + " jobs lọt qua.");


            List<Job> ListJDFlowVector;
            if (!jobsFromDb.isEmpty() && !getQueryEmbedding.isBlank()) {
                try {
                    float[] queryVector = embeddingService.createEmbedding(getQueryEmbedding);
                    Map<Job, Double> jobScores = new HashMap<>();

                    for (Job job : jobsFromDb) {
                        float[] jobVector = job.getVectorEmbedding();

                        if (jobVector != null && jobVector.length > 0) {
                            System.out.println("jobVector dđã chạy");
                            double score = calculateCosineSimilarityForSemanticSearch(queryVector, jobVector);

                            if (score > 0.2) {
                                jobScores.put(job, score);
                            }
                        }
                    }
                    ///  Dùng AI đọc LẠI List JD
                    ListJDFlowVector = jobScores.entrySet().stream()
                            .sorted(Map.Entry.<Job, Double>comparingByValue().reversed())
                            .limit(8)
                            .peek(entry -> System.out.println("   + Job: " + entry.getKey().getTitle() + " - Score-Final: " + entry.getValue()))
                            .map(Map.Entry::getKey)
                            .collect(Collectors.toList());

                    final List<Job> finalListForLambda = ListJDFlowVector;
                    ///  Chuyen lai sang Sitrng + Gán ID
                    String JDListString = IntStream.range(0, finalListForLambda.size())
                            .mapToObj(i -> {
                                Job job = finalListForLambda.get(i);
                                int displayID = i + 1;
                                ///  Lấy kỹ năng
                            String Skill_Names ="";
                            if(job.getJobSkills() != null && !job.getJobSkills().isEmpty()) {
                                Skill_Names = job.getJobSkills().stream()
                                        .map(jobSkill -> jobSkill.getSkill().getName())
                                        .collect(Collectors.joining(","));
                            }

                                return String.format(
                                        "[%d] Công ty: %s | Mô tả: %s |Hạng mục: %s | Kỹ Năng: %s",
                                        displayID,
                                        job.getCompany().getName().toUpperCase(),
                                        job.getDescription(),
                                        job.getTitle(),
                                        Skill_Names
                                );
                            })
                            .collect(Collectors.joining("\n"));
                    String promptTemplate2 = """
                            Bạn là hệ thống AI phân tích dữ liệu nhân sự cốt lõi của ứng dụng SkillBridge. 
                            ... (Nội dung Prompt của bạn) ...
                            [Danh sách các JD ]: %s
                            [YÊU CẦU TỪ NGƯỜI DÙNG]: "%s"
                            """;
                    String promptAIChekRequest = String.format(promptTemplate2, JDListString, StringOfsearch_query);
                    System.out.println("promptAICpromptAIChekRequesthekRequest" + promptAIChekRequest);
                    String aiFinalReSpond = aiService.Ai_OF_SKILLBRIDGE(promptAIChekRequest, 4);
                    System.out.println("aiFinalReSpond: " + aiFinalReSpond);
                    /// --- Khu vực bóc tách ID Ảo của AI trả về ---
                    try {
                        JsonNode aiResultNode = objectMapper.readTree(aiFinalReSpond);

                        if (aiResultNode.has("selected_ids") && aiResultNode.get("selected_ids").isArray()) {
                            Set<Integer> selectedDisplayIds = new HashSet<>();
                            for (JsonNode idNode : aiResultNode.get("selected_ids")) {
                                selectedDisplayIds.add(idNode.asInt());
                            }

                            System.out.println("--> AI selected_ids: " + selectedDisplayIds);

                            List<Job> filteredByAI = new ArrayList<>();
                            for (int i = 0; i < ListJDFlowVector.size(); i++) {
                                if (selectedDisplayIds.contains(i + 1)) {
                                    filteredByAI.add(ListJDFlowVector.get(i));
                                }
                            }

                            System.out.println("--> Sau AI filter: " + filteredByAI.size() + " jobs được giữ lại.");
                            ListJDFlowVector = filteredByAI;

                        } else {
                            System.out.println("--> AI không trả về selected_ids → giữ nguyên " + ListJDFlowVector.size() + " jobs.");
                        }

                    } catch (Exception parseEx) {
                        System.out.println("--> Lỗi parse aiFinalReSpond → fallback giữ nguyên danh sách.");
                        parseEx.printStackTrace();
                    }
                ///  ---- End Boc tách
                } catch (Exception e) {
                    System.out.println("Lỗi tạo vector hoặc so sánh Cosine");
                    e.printStackTrace();
                    throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
                }
            } else {
                ListJDFlowVector = jobsFromDb;
            }

            System.out.println("--> ẢI 2 (Vector): " + ListJDFlowVector.size() + " jobs được chọn.");

            List<JobSemanticSearchResponse> resultList = new ArrayList<>();
            for (Job job : ListJDFlowVector) {
                JobResponse.CompanyDTO companyDTO = null;
                if (job.getCompany() != null) {
                    companyDTO = JobResponse.CompanyDTO.builder()
                            .id(job.getCompany().getId())
                            .name(job.getCompany().getName())
                            .logoUrl(job.getCompany().getImageUrl())
                            .build();
                }

                JobResponse.CategoryDTO categoryDTO = null;
                if (job.getCategory() != null) {
                    categoryDTO = JobResponse.CategoryDTO.builder()
                            .id(job.getCategory().getId())
                            .name(job.getCategory().getName())
                            .build();
                }

                List<JobResponse.JobSkillDTO> skillDTOList = new ArrayList<>();
                if (job.getJobSkills() != null) {
                    job.getJobSkills().forEach(jobSkill -> {
                        skillDTOList.add(JobResponse.JobSkillDTO.builder()
                                .name(jobSkill.getSkill().getName())
                                .build());
                    });
                }

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

            System.out.println("--> CHỐT: Trả về Client " + resultList.size() + " jobs.");
            return resultList;

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("AI error", e);
        } finally {
            System.out.println("--- findJobBySemanticSearch KẾT THÚC ---");
        }
    }
    private double calculateCosineSimilarityForSemanticSearch(float[] vectorA, float[] vectorB) {
        if (vectorA == null || vectorB == null || vectorA.length != vectorB.length) {
            return 0.0; // Hoặc throw Exception tuỳ logic của bạn
        }

        double dotProduct = 0.0;
        double normA = 0.0;
        double normB = 0.0;

        for (int i = 0; i < vectorA.length; i++) {
            dotProduct += vectorA[i] * vectorB[i];
            normA += Math.pow(vectorA[i], 2);
            normB += Math.pow(vectorB[i], 2);
        }

        if (normA == 0.0 || normB == 0.0) return 0.0;

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }


}
