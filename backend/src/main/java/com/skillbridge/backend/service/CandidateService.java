package com.skillbridge.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillbridge.backend.config.CustomUserDetails;
import com.skillbridge.backend.dto.request.CandidateSkillRequest;
import com.skillbridge.backend.dto.request.DegreeRequest;
import com.skillbridge.backend.dto.request.ExperienceDetail;
import com.skillbridge.backend.dto.request.UpdateCandidateCvRequest;
import com.skillbridge.backend.dto.response.CandidateSkillResponse;
import com.skillbridge.backend.dto.response.DegreeResponse;
import com.skillbridge.backend.dto.response.LLMResumeResponse;
import com.skillbridge.backend.dto.response.UpdateCandidateCvResponse;
import com.skillbridge.backend.entity.*;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.repository.*;
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

import java.util.ArrayList;
import java.util.List;

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

        return new UpdateCandidateCvResponse(
                candidate.getName(),
                candidate.getDescription(),
                candidate.getAddress(),
                candidate.getCategory() != null ? candidate.getCategory().getName() : null,
                degreeResponses,
                skillResponses,
                experienceDetails
        );
    }

    /**
     * Chuyển đổi dữ liệu bằng cấp từ JSON/Object sang danh sách DegreeResponse
     * */
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
        return res;
    }

    /**
     * Chuyển đổi dữ liệu kinh nghiệm làm việc sang danh sách ExperienceDetail
     * */
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
     * Cập nhật thông tin CV thủ công
     */
    @Transactional
    public UpdateCandidateCvResponse updateCv(String userId, UpdateCandidateCvRequest request) {
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
            if (request.getIsOpenToWork() != null) candidate.setIsOpenToWork(request.getIsOpenToWork());
            if (request.getDescription() != null) candidate.setDescription(request.getDescription());
            if (request.getAddress() != null) candidate.setAddress(request.getAddress());
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
            if (request.getSkills() != null) {
                candidateSkillRepository.deleteByCandidate_Id(userId);
                candidateSkillRepository.flush();

                List<CandidateSkill> newSkills = new ArrayList<>();

                for (CandidateSkillRequest sReq : request.getSkills()) {
                    Skill skillEntity = skillRepository.getReferenceById(sReq.getSkillId());

                    CandidateSkill cs = new CandidateSkill();
                    cs.setCandidate(candidate);
                    cs.setSkill(skillEntity);
                    cs.setExperienceYears(sReq.getExperienceYears() != null ? sReq.getExperienceYears() : 0);
                    newSkills.add(cs);
                }

                if (!newSkills.isEmpty()) {
                    candidateSkillRepository.saveAll(newSkills);
                    candidateSkillRepository.flush();
                }
            }
            candidateRepository.save(candidate);

            UpdateCandidateCvResponse response = getCv(userId);

            messagingTemplate.convertAndSend("/topic/candidate/" + userId + "/cv-update", response);

            systemLog.info(currentUser, "Cập nhật hồ sơ cá nhân thành công");

            return response;
        }  catch (AppException e) {
            log.warn("[CV_UPDATE] Lỗi nghiệp vụ khi cập nhật hồ sơ cho {}: {}", userId, e.getErrorCode().getMessage());
            throw e;
        } catch (Exception e) {
            log.error("[SYSTEM_ERROR] Lỗi hệ thống khi cập nhật hồ sơ cho {}: ", userId, e);
            systemLog.danger(currentUser, "Lỗi hệ thống khi lưu hồ sơ: " + e.getMessage());
            throw new AppException(ErrorCode.INVALID_JSON_FORMAT);
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
        Phân tích CV sau và trả về JSON chuẩn. 
        YÊU CẦU NGHIÊM NGẶT: 
        1. Chỉ trả về JSON, không giải thích.
        2. Nếu mảng 'experience' hoặc 'skills' quá dài, hãy tóm tắt lại để đảm bảo JSON không bị cắt ngang.
        3. Kiểm tra kỹ các dấu đóng ngoặc } và ] trước khi kết thúc.
        4. Nếu endDate là hiện tại thì trả  ngày hiện tại theo định dạng yyyy-MM-dd
        
         Cấu trúc JSON yêu cầu:
             {
               "name": "Họ và tên",
               "address": "Địa chỉ liên lạc",
               "description": "Tóm tắt mục tiêu hoặc giới thiệu bản thân",
               "degrees": [
                 {
                   "type": "DEGREE",
                   "degree": "Tên bằng cấp (nếu là DEGREE)",
                   "major": "Ngành học",
                   "institution": "Tên trường/tổ chức cấp",
                   "graduationYear": 2023
                 },
                 {
                   "type": "CERTIFICATE",
                   "name": "Tên chứng chỉ (nếu là CERTIFICATE)",
                   "year" 2025
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
                   "skillName": "Tên kỹ năng",
                   "experienceYears": 3
                 }
               ]
             }
        
        VĂN BẢN CV:
        %s
        """;
    private String buildPrompt(String rawText) {
        return String.format(PROMPT, rawText);
    }

    /**
     * Parsing CV bằng AI (Gemini)
     */
    public UpdateCandidateCvRequest parsingCV(MultipartFile file) {
        CustomUserDetails currentUser = securityUtils.getCurrentUser();
        try {
            log.info("[AI_PARSING] Bắt đầu quét CV cho user: {}", currentUser.getUserId());

            String rawText = ocrService.scanFile(file);
            if (rawText == null || rawText.isBlank()) {
                throw new AppException(ErrorCode.OCR_FAILED);
            }

            LLMResumeResponse llmRes = geminiService.callGemini(buildPrompt(rawText), LLMResumeResponse.class);

            UpdateCandidateCvRequest request = convertLLMToRequest(llmRes);

            systemLog.info(currentUser, "AI đã phân tích thành công CV tải lên");
            return request;

        } catch (Exception e) {
            log.error("[AI_ERROR] Thất bại khi phân tích CV: ", e);
            systemLog.danger(currentUser, "AI không thể phân tích CV: " + e.getMessage());
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    /**
     * Chuyển đổi kết quả từ mô hình ngôn ngữ lớn (LLM) sang định dạng Request của hệ thống.
     * Đồng thời tự động map tên kỹ năng từ AI sang ID kỹ năng trong Database.
     */
    private UpdateCandidateCvRequest convertLLMToRequest(LLMResumeResponse res) {
        UpdateCandidateCvRequest request = new UpdateCandidateCvRequest();
        request.setName(res.name);
        request.setAddress(res.address);
        request.setDescription(res.description);
        request.setDegrees(res.degrees);
        request.setExperience(res.experience);
        if (res.skills != null && !res.skills.isEmpty()) {
            List<CandidateSkillRequest> skillRequests = new ArrayList<>();
            for (CandidateSkillResponse llmSkill : res.skills) {
                if (llmSkill.getSkillName() == null) continue;
                String skillNameFromAI = llmSkill.getSkillName().trim();
                skillRepository.findByName(skillNameFromAI)
                        .stream()
                        .findFirst()
                        .ifPresent(skillEntity -> {
                            CandidateSkillRequest sr = new CandidateSkillRequest();
                            sr.setSkillId(skillEntity.getId());
                            Integer years = llmSkill.getExperienceYears();
                            sr.setExperienceYears(years != null ? years : 1);
                            skillRequests.add(sr);
                        });
            }
            request.setSkills(skillRequests);
        }
        return request;
    }
}