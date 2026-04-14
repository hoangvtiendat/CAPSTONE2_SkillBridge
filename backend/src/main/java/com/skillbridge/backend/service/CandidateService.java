package com.skillbridge.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillbridge.backend.config.CustomUserDetails;
import com.skillbridge.backend.dto.request.CandidateSkillRequest;
import com.skillbridge.backend.dto.request.DegreeRequest;
import com.skillbridge.backend.dto.request.ExperienceDetail;
import com.skillbridge.backend.dto.request.UpdateCandidateCvRequest;
import com.skillbridge.backend.dto.response.*;
import com.skillbridge.backend.entity.*;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.repository.*;
import com.skillbridge.backend.service.AI_Service_File.AiService;
import com.skillbridge.backend.utils.CosineSimilarityUtils;
import com.skillbridge.backend.utils.SecurityUtils;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CandidateService {
    CandidateRepository candidateRepository;
    CategoryRepository categoryRepository;
    ObjectMapper objectMapper;
    UserRepository userRepository;
    SkillRepository skillRepository;
    CandidateSkillRepository candidateSkillRepository;
    OcrService ocrService;
    GeminiService geminiService;
    SystemLogService systemLog;
    SecurityUtils securityUtils;
    SimpMessagingTemplate messagingTemplate;
    EmbeddingService embeddingService;
    FileStorageService fileStorageService;
    ApplicationRepository applicationRepository;
    InterviewRepository interviewRepository;

    CVJobEvaluationRepository cvJobEvaluationRepository;
    JobRepository jobRepository;
    CosineSimilarityUtils cosineSimilarityUtils;
    AiService aiService;

    @NonFinal
    @Value("${gemini.api.key}")
    private String apiKey;

    /**
     * Lấy thông tin CV hiện tại của Candidate
     */
    public UpdateCandidateCvResponse getCv(String userId) {
        Candidate candidate = candidateRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        List<DegreeResponse> degreeResponses = deserializeDegrees(candidate.getDegree());
        List<ExperienceDetail> experienceDetails = deserializeExperience(candidate.getExperience());

        List<CandidateSkill> currentSkills = candidateSkillRepository.findByCandidate(candidate);
        List<CandidateSkillResponse> skillResponses = currentSkills.stream().map(s -> {
            CandidateSkillResponse res = new CandidateSkillResponse(s.getSkill().getId(), s.getSkill().getName(), s.getExperienceYears());
            return res;
        }).toList();

        return UpdateCandidateCvResponse.builder()
                .name(candidate.getName())
                .description(candidate.getDescription())
                .isOpenToWork(candidate.getIsOpenToWork())
                .address(candidate.getAddress())
                .categoryId(candidate.getCategory() != null ? candidate.getCategory().getId() : null)
                .category(candidate.getCategory() != null ? candidate.getCategory().getName() : null)
                .cvUrl(candidate.getCvUrl())
                .degrees(degreeResponses)
                .skills(skillResponses)
                .experience(experienceDetails)
                .build();
    }
    /// dùng để lấy CV cho chức năng tìm kiếm theo ngũ nghĩa khi chưa có CV
    public UpdateCandidateCvResponse getCV_searchsenematic(String userId) {
        Candidate candidate = candidateRepository.findById(userId).orElse(null);

        if (candidate == null) {
            return new UpdateCandidateCvResponse();
        }

        List<DegreeResponse> degreeResponses = deserializeDegrees(candidate.getDegree());
        List<ExperienceDetail> experienceDetails = deserializeExperience(candidate.getExperience());

        List<CandidateSkill> currentSkills = candidateSkillRepository.findByCandidate(candidate);
        List<CandidateSkillResponse> skillResponses = currentSkills.stream().map(s -> {
            CandidateSkillResponse res = new CandidateSkillResponse(
                    s.getSkill().getId(),
                    s.getSkill().getName(),
                    s.getExperienceYears()
            );
            return res;
        }).toList();

        return new UpdateCandidateCvResponse(
                candidate.getName(),
                candidate.getDescription(),
                candidate.getIsOpenToWork(),
                candidate.getAddress(),
                candidate.getCategory() != null ? candidate.getCategory().getId() : null,
                candidate.getCategory() != null ? candidate.getCategory().getName() : null,
                candidate.getCvUrl(),
                degreeResponses,
                skillResponses,
                experienceDetails
        );
    }
    /**
     * Chuyển đổi dữ liệu bằng cấp từ JSON/Object sang danh sách DegreeResponse
     */
    private List<DegreeResponse> deserializeDegrees(Object degreeObj) {
        if (degreeObj == null) return new ArrayList<>();
        try {
            String json = degreeObj instanceof String ? (String) degreeObj : objectMapper.writeValueAsString(degreeObj);
            List<DegreeRequest> list = objectMapper.readValue(json, new TypeReference<List<DegreeRequest>>() {
            });
            return list.stream().map(this::toDegreeResponse).toList();
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    /**
     * Helper map dữ liệu từ Request sang Response cho bằng cấp.
     */
    private DegreeResponse toDegreeResponse(DegreeRequest req) {
        DegreeResponse res = new DegreeResponse();
        res.setType(req.getType());
        res.setDegree(req.getDegree());
        res.setMajor(req.getMajor());
        res.setInstitution(req.getInstitution());
        res.setGraduationYear(req.getGraduationYear() != null ? String.valueOf(req.getGraduationYear()) : null);
        res.setName(req.getName());
        res.setYear(req.getYear() != null ? String.valueOf(req.getYear()) : null);
        res.setLevel(req.getLevel());
        return res;
    }

    /**
     * Chuyển đổi dữ liệu kinh nghiệm làm việc sang danh sách ExperienceDetail
     */
    private List<ExperienceDetail> deserializeExperience(Object expObj) {
        if (expObj == null) return new ArrayList<>();
        try {
            if (expObj instanceof List) {
                return objectMapper.convertValue(expObj, new TypeReference<List<ExperienceDetail>>() {
                });
            }
            String json = expObj.toString();
            return objectMapper.readValue(json, new TypeReference<List<ExperienceDetail>>() {
            });
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    /**
     * Cập nhật thông tin CV
     */
    @Transactional
    public UpdateCandidateCvResponse updateCv(String userId, UpdateCandidateCvRequest request, MultipartFile cv) throws IOException {
        CustomUserDetails currentUser = securityUtils.getCurrentUser();
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

            Candidate candidate = candidateRepository.findById(userId)
                    .orElseGet(() -> {
                        Candidate newCandidate = new Candidate();
                        newCandidate.setUser(user);
                        return newCandidate;
                    });

            if (request.getName() != null) candidate.setName(request.getName());
            if (request.getDescription() != null) candidate.setDescription(request.getDescription());
            if (request.getAddress() != null) candidate.setAddress(request.getAddress());
            if (cv != null) {
                String cvUrl = fileStorageService.saveFile(cv, "CVs");
                candidate.setCvUrl(cvUrl);
            }
            if (request.getCategoryId() != null) {
                Category category = categoryRepository.findById(request.getCategoryId())
                        .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
                candidate.setCategory(category);
            }

            if (request.getExperience() != null) {
                candidate.setExperience(request.getExperience());
            }

            if (request.getDegrees() != null) {
                validateDegrees(request.getDegrees());
                candidate.setDegree(request.getDegrees());
            }
            candidate = candidateRepository.saveAndFlush(candidate);

            List<CandidateSkill> finalSkills = new ArrayList<>();
            StringBuilder skillBuilder = new StringBuilder();

            if (request.getSkills() != null) {
                candidateSkillRepository.deleteByCandidate_Id(userId);
                candidateSkillRepository.flush();
                for (CandidateSkillRequest sReq : request.getSkills()) {
                    Skill skillEntity = skillRepository.findById(sReq.getSkillId())
                            .orElseThrow(() -> new AppException(ErrorCode.SKILL_NOT_FOUND));

                    CandidateSkill cs = new CandidateSkill();
                    cs.setCandidate(candidate);
                    cs.setSkill(skillEntity);
                    cs.setExperienceYears(sReq.getExperienceYears() != null ? sReq.getExperienceYears() : 0);
                    skillBuilder.append(skillEntity.getName()).append(", ");
                    finalSkills.add(cs);
                }

                if (!finalSkills.isEmpty()) {
                    candidateSkillRepository.saveAll(finalSkills);
                    candidateSkillRepository.flush();
                }
            } else {
                finalSkills = candidateSkillRepository.findByCandidate(candidate);
                finalSkills.forEach(s -> skillBuilder.append(s.getSkill().getName()).append(", "));
            }
            try {
                UpdateCandidateCvResponse fullProfile = UpdateCandidateCvResponse.builder()
                    .name(candidate.getName())
                    .address(candidate.getAddress())
                    .description(candidate.getDescription())
                    .degrees(deserializeDegrees(candidate.getDegree()))
                    .experience(deserializeExperience(candidate.getExperience()))
                    .categoryId(candidate.getCategory() != null ? candidate.getCategory().getId() : null)
                    .category(candidate.getCategory() != null ? candidate.getCategory().getName() : null)
                    .skills(finalSkills.stream().map(s -> {
                        CandidateSkillResponse sr = new CandidateSkillResponse();
                        sr.setSkillId(s.getSkill().getId());
                        sr.setSkillName(s.getSkill().getName());
                        sr.setExperienceYears(s.getExperienceYears());
                        return sr;
                    }).toList())
                    .build();
                candidate.setParsedContentJson(objectMapper.writeValueAsString(fullProfile));
                log.info("[DATA_SYNC] Đã hợp nhất dữ liệu và cập nhật parsedContentJson cho: {}", userId);
            } catch (Exception e) {
                log.error("[DATA_SYNC_ERROR] Không thể tạo parsedContentJson: ", e);
            }

            StringBuilder textBuilder = new StringBuilder();

            if (candidate.getCategory() != null) {
                textBuilder.append("Lĩnh vực: ").append(candidate.getCategory().getName()).append(". ");
            }

            List<DegreeResponse> degrees = deserializeDegrees(candidate.getDegree());
            if (!degrees.isEmpty()) {
                textBuilder.append("Học vấn: ");
                for (DegreeResponse d : degrees) {
                    textBuilder.append(d.getDegree() != null ? d.getDegree() : d.getName())
                            .append(" chuyên ngành ").append(d.getMajor())
                            .append(" tại ").append(d.getInstitution())
                            .append(" với cấp độ ").append(d.getLevel()).append(", ");
                }
            }

            List<ExperienceDetail> experiences = deserializeExperience(candidate.getExperience());
            if (!experiences.isEmpty()) {
                textBuilder.append("Kinh nghiệm: ");
                for (ExperienceDetail exp : experiences) {
                    textBuilder.append(exp.getDescription()).append(". ");
                }
            }

            if (skillBuilder.length() > 0) {
                textBuilder.append("Kỹ năng: ").append(skillBuilder.substring(0, skillBuilder.length() - 2));
            }

            try {
                float[] vector = embeddingService.createEmbedding(textBuilder.toString());
                candidate.setVectorEmbedding(vector);
                log.info("[EMBEDDING] Cập nhật vector thành công cho Candidate: {}", userId);
            } catch (Exception e) {
                log.error("[EMBEDDING_ERROR] Lỗi tạo vector: {}", e.getMessage());
            }
            candidateRepository.save(candidate);

            UpdateCandidateCvResponse response = getCv(userId);
            messagingTemplate.convertAndSend("/topic/candidate/" + userId + "/cv-update", response);
            systemLog.info(currentUser, "Cập nhật hồ sơ cá nhân thành công");

            List<Application> applications = applicationRepository.findAllByCandidate(candidate);

            for (Application app : applications) {
                interviewRepository.deleteByApplication(app); // xoá con trước
            }

            applicationRepository.deleteByCandidate(candidate); // xoá
            return response;
        } catch (AppException e) {
            log.warn("[CV_UPDATE] Lỗi nghiệp vụ khi cập nhật hồ sơ cho {}: {}", userId, e.getErrorCode().getMessage());
            throw e;
        } catch (Exception e) {
            log.error("[SYSTEM_ERROR] Lỗi hệ thống khi cập nhật hồ sơ cho {}: ", userId, e);
            systemLog.danger(currentUser, "Lỗi hệ thống khi lưu hồ sơ: " + e.getMessage());
            throw new AppException(ErrorCode.INVALID_JSON_FORMAT);
        }
    }

    @Transactional
    public UpdateCandidateCvResponse updateOpenToWork(String userId, boolean isOpenToWork) {
        try{
            Candidate candidate = candidateRepository.findById(userId)
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
            candidate.setIsOpenToWork(isOpenToWork);
            candidateRepository.save(candidate);
            return getCv(userId);
        }catch(AppException e) {
            log.warn("[CV_UPDATE] Lỗi nghiệp vụ khi cập nhật hồ sơ cho {}: {}", userId, e.getErrorCode().getMessage());
            throw e;
        }
    }

    /**
     * Xác thực tính hợp lệ của dữ liệu bằng cấp/chứng chỉ.
     */
    private void validateDegrees(List<DegreeRequest> degrees) {
        for (DegreeRequest d : degrees) {
            if (d.getType() == null) throw new AppException(ErrorCode.DEGREE_TYPE_REQUIRED);
            if ("DEGREE".equals(d.getType())) {
                if (d.getDegree() == null || d.getInstitution() == null)
                    throw new AppException(ErrorCode.INVALID_DEGREE_TYPE);
            } else if ("CERTIFICATE".equals(d.getType())) {
                if (d.getName() == null) throw new AppException(ErrorCode.INVALID_CERTIFICATE_INFO);
            }
        }
    }

    private static final String PROMPT = """
            Phân tích CV sau và trả về JSON chuẩn dựa trên danh sách ngành và kỹ năng cho sẵn.
            
            DANH SÁCH NGÀNH VÀ KỸ NĂNG TỪ HỆ THỐNG:
            %s
            
            YÊU CẦU NGHIÊM NGẶT:
            1. Chỉ trả về JSON, không giải thích.
            2. Ánh xạ 'categoryId' từ danh sách ngành phù hợp nhất.
            3. Với mỗi kỹ năng trong CV, hãy tìm 'skillId' tương ứng trong danh sách kỹ năng của ngành đó. Nếu không khớp 100%%, hãy chọn cái gần nhất.
            4. Nếu mảng 'experience' hoặc 'skills' quá dài, hãy tóm tắt lại để đảm bảo JSON không bị cắt ngang.
            5. Kiểm tra kỹ các dấu đóng ngoặc } và ] trước khi kết thúc.
            6. Nếu endDate là hiện tại thì trả ngày hiện tại theo định dạng yyyy-MM-dd.
            
            Cấu trúc JSON yêu cầu:
            {
              "name": "Họ và tên",
              "address": "Địa chỉ liên lạc",
              "description": "Tóm tắt mục tiêu hoặc giới thiệu bản thân",
              "categoryId": "ID của ngành từ danh sách trên",
              "degrees": [
                {
                  "type": "DEGREE",
                  "degree": "Tên bằng cấp (nếu là DEGREE)",
                  "major": "Ngành học",
                  "institution": "Tên trường/tổ chức cấp",
                  "graduationYear": 2023,
                   "level": "Số điểm/ level của bằng cấp đó"
                },
                {
                  "type": "CERTIFICATE",
                  "name": "Tên chứng chỉ (nếu là CERTIFICATE)",
                  "year": 2025,
                  "level": "Số điểm/ level của chứng chỉ đó"
                }
              ],
              "experience": [
                {
                  "startDate": "yyyy-MM-dd",
                  "endDate": "yyyy-MM-dd hoặc null",
                  "description": "Chi tiết công việc"
                }
              ],
              "skills": [
                {
                  "skillId": "ID của kỹ năng từ danh sách trên",
                  "skillName": "Tên kỹ năng gốc từ CV",
                  "experienceYears": 3
                }
              ]
            }
            
            VĂN BẢN CV:
            %s
            """;

    private String buildPrompt(String rawText, List<Category> categories, List<Skill> allSkills) {
        StringBuilder metaData = new StringBuilder();
        for (Category cat : categories) {
            metaData.append("- Ngành [ID: ").append(cat.getId()).append(", Name: ").append(cat.getName()).append("]\n");
            metaData.append("  Kỹ năng: ");
            allSkills.stream()
                    .filter(s -> s.getCategory() != null && s.getCategory().getId().equals(cat.getId()))
                    .forEach(s -> metaData.append("[").append(s.getId()).append(": ").append(s.getName()).append("], "));
            metaData.append("\n");
        }

        return String.format(PROMPT, metaData.toString(), rawText);
    }

    /**
     * Parsing CV bằng AI (Gemini)
     */
    public LLMResumeResponse parsingCV(MultipartFile file) {
        CustomUserDetails currentUser = securityUtils.getCurrentUser();
        try {
            log.info("[AI_PARSING] Bắt đầu quét CV cho user: {}", currentUser.getUserId());

            String rawText = ocrService.scanFile(file);
//            if (rawText == null || rawText.isBlank()) {
//                throw new AppException(ErrorCode.OCR_FAILED);
//            }
//
//            List<Category> categories = categoryRepository.findAll();
//            List<Skill> allSkills = skillRepository.findAll();
//            LLMResumeResponse llmRes = geminiService.callGemini(
//                    buildPrompt(rawText, categories, allSkills),
//                    LLMResumeResponse.class
//            );
//
//            if (llmRes.getCategoryId() != null && !llmRes.getCategoryId().isBlank()) {
//                categoryRepository.findById(llmRes.getCategoryId()).ifPresent(cat -> {
//                    llmRes.setCategoryName(cat.getName());
//                });
//            }
//
//            if (llmRes.getSkills() != null) {
//                final String identifiedCatId = llmRes.getCategoryId();
//
//                for (CandidateSkillResponse sr : llmRes.getSkills()) {
//                    if (sr != null && sr.getSkillName() != null) {
//                        String nameToMatch = sr.getSkillName().trim();
//
//                        // 1. Try to find by ID if provided and valid
//                        if (sr.getSkillId() != null && !sr.getSkillId().isEmpty() && !sr.getSkillId().contains("ID_")) {
//                             Skill foundById = allSkills.stream()
//                                     .filter(s -> s.getId().equals(sr.getSkillId()))
//                                     .findFirst().orElse(null);
//                             if (foundById != null) {
//                                 sr.setSkillId(foundById.getId());
//                                 sr.setSkillName(foundById.getName());
//                                 continue;
//                             }
//                        }
//
//                        // 2. Try exact match (case-insensitive) within the identified category first
//                        Skill matched = null;
//                        if (identifiedCatId != null) {
//                            matched = allSkills.stream()
//                                    .filter(sk -> sk.getCategory() != null && sk.getCategory().getId().equals(identifiedCatId))
//                                    .filter(sk -> sk.getName() != null && sk.getName().equalsIgnoreCase(nameToMatch))
//                                    .findFirst()
//                                    .orElse(null);
//                        }
//
//                        // 3. If no match in category, search globally (exact match)
//                        if (matched == null) {
//                            matched = allSkills.stream()
//                                    .filter(sk -> sk.getName() != null && sk.getName().equalsIgnoreCase(nameToMatch))
//                                    .findFirst()
//                                    .orElse(null);
//                        }
//
//                        // 4. Try "Contains" match if still nothing
//                        if (matched == null) {
//                             matched = allSkills.stream()
//                                    .filter(sk -> sk.getName() != null && (
//                                            sk.getName().equalsIgnoreCase(nameToMatch) ||
//                                            nameToMatch.toLowerCase().contains(sk.getName().toLowerCase()) ||
//                                            sk.getName().toLowerCase().contains(nameToMatch.toLowerCase())
//                                    ))
//                                    .findFirst()
//                                    .orElse(null);
//                        }
//
//                        if (matched != null) {
//                            sr.setSkillId(matched.getId());
//                            sr.setSkillName(matched.getName());
//                        } else {
//                            sr.setSkillId(null);
//                            // Keep the original name for display, but it will have No ID
//                        }
//                    }
//                }
//            }
//              --------------- ---------------- ---------------- ------
            systemLog.info(currentUser, "AI đã phân tích thành công CV tải lên");
            String dataParsing = aiService.parsingCV_AI(rawText);
            log.info("[AI_PARSING] Dữ liệu nhận được: {}", dataParsing);

            if (dataParsing != null && dataParsing.contains("```")) {
                dataParsing = dataParsing.replaceAll("```json|```", "").trim();
            }

            ObjectMapper objectMapper = new ObjectMapper();
            ///  check lỗi dữ liệu data
            objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
            ///  register ngày cho objmapper
            objectMapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());

            LLMResumeResponse llmRes = objectMapper.readValue(dataParsing, LLMResumeResponse.class);

            if (llmRes == null) {
                throw new AppException(ErrorCode.AI_PARSING_FAILED);
            }

            return llmRes;

        } catch (Exception e) {
            log.error("[AI_ERROR] Thất bại khi phân tích CV: ", e);
            systemLog.danger(currentUser, "AI không thể phân tích CV: " + e.getMessage());
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    /**
     * Nhà ứng tuyển săn nhân tài - tìm ra 10 ứng viên matching với job nhất
     */
    @Transactional
    public List<CandidateResponse> findPotentialCandidates(String jobId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new AppException(ErrorCode.JOB_NOT_FOUND));

        float[] jobVector = job.getVectorEmbedding();

        List<String> requiredSkillNames = job.getJobSkills().stream()
                .map(jobSkill -> jobSkill.getSkill().getName())
                .collect(Collectors.toList());

        List<Candidate> filteredCandidates = candidateRepository.findCandidatesBySkillMatch(requiredSkillNames, jobId);

        return filteredCandidates.stream()
            .filter(candidate -> candidate.getVectorEmbedding() != null)
            .map(candidate -> {
                float[] candidateVector = candidate.getVectorEmbedding();
                double score = cosineSimilarityUtils.cosineSimilarity(jobVector, candidateVector);
                candidate.setAiMatchingScore((float) score);
                return candidate;
            })
            .sorted(Comparator.comparingDouble(Candidate::getAiMatchingScore).reversed())
            .limit(10)
            .map(this::mapToCandidateResponse)
            .collect(Collectors.toList());
    }

    /**
     * Hàm hỗ trợ ánh xạ dữ liệu từ Entity Candidate sang CandidateResponse DTO
     */
     public CandidateResponse mapToCandidateResponse(Candidate candidate) {
        User user = candidate.getUser();
        List<CandidateSkill> currentSkills = candidateSkillRepository.findByCandidate(candidate);
        List<CandidateSkillResponse> skillResponses = currentSkills.stream().map(s ->
                new CandidateSkillResponse(s.getSkill().getId(), s.getSkill().getName(), s.getExperienceYears())
        ).toList();
        return CandidateResponse.builder()
                .id(candidate.getId())
                .name(candidate.getName())
                .email(user != null ? user.getEmail():null)
                .phoneNumber(user != null ? user.getPhoneNumber():null)
                .address(candidate.getAddress())
                .avatar(user != null ? user.getAvatar() : null)
                .description(candidate.getDescription())
                .aiMatchingScore(candidate.getAiMatchingScore())
                .experience(candidate.getExperience())
                .degrees(candidate.getDegree())
                .skills(skillResponses)
                .category(candidate.getCategory() != null ? candidate.getCategory().getName() : null)
                .build();
    }
    /**
     *  Nhà ứng tuyển đã tìm được người phù hợp và đánh gía ứng viên đó với job
     */
    @Transactional
    public CVJobEvaluation getOrInitiateRecruiterEvaluation(String candidateId, String jobId) {
        Optional<CVJobEvaluation> existingEval = cvJobEvaluationRepository
                .findByCandidateIdAndJobId(candidateId, jobId);

//        if (existingEval.isPresent()){
//            CVJobEvaluation eval = existingEval.get();
//            return eval;
//        }

        CVJobEvaluation eval = existingEval.get();
        return eval;

//        log.info("[SOURCING] Khởi tạo đánh giá mới từ Recruiter cho Candidate: {} - Job: {}", candidateId, jobId);
//        return performNewEvaluationByRecruiter(candidateId, jobId);
//        return existingEval.get();
    }
    ///  check CV ccó kt đảy lên hay chưa
    public Boolean checkCV(){
        Boolean result = false;
        String idOfUser = securityUtils.getCurrentUserId();
        UpdateCandidateCvResponse cv = getCV_searchsenematic(idOfUser);
        System.out.println("cvNe");
        System.out.println(cv);
        if(cv.getName() != null && cv.getDescription() != null && cv.getExperience() != null && cv.getSkills() != null) {
            result = true;
            return result;
        }
       return result;
    }
}