package com.skillbridge.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillbridge.backend.dto.request.CandidateSkillRequest;
import com.skillbridge.backend.dto.request.DegreeRequest;
import com.skillbridge.backend.dto.request.ExperienceDetail;
import com.skillbridge.backend.dto.request.UpdateCandidateCvRequest;
import com.skillbridge.backend.dto.response.CandidateSkillResponse;
import com.skillbridge.backend.dto.response.DegreeResponse;
import com.skillbridge.backend.dto.response.UpdateCandidateCvResponse;
import com.skillbridge.backend.entity.*;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.repository.*;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class CandidateService {
    private final CandidateRepository candidateRepository;
    private final CategoryRepository categoryRepository;
    private final ObjectMapper objectMapper;
    private final UserRepository userRepository;
    private final SkillRepository skillRepository;
    private final CandidateSkillRepository candidateSkillRepository;
    private OcrService ocrService;
    @Value("${gemini.api.key}")
    private String apiKey;

    private static class LLMResumeResponse {
        public String name;
        public String description;
        public String address;
        public List<DegreeRequest> degrees;
        public List<ExperienceDetail> experience;
        public List<CandidateSkillResponse> skills;
    }

    private final RestTemplate restTemplate = new RestTemplate();

    public CandidateService(CandidateRepository candidateRepository,
                            CategoryRepository categoryRepository,
                            UserRepository userRepository,
                            SkillRepository skillRepository,
                            CandidateSkillRepository candidateSkillRepository,
                            ObjectMapper objectMapper,
                            OcrService ocrService) {
        this.candidateRepository = candidateRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
        this.skillRepository = skillRepository;
        this.candidateSkillRepository = candidateSkillRepository;
        this.objectMapper = objectMapper;
        this.ocrService = ocrService;
    }

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

    private ExperienceDetail toExperienceDetail(ExperienceDetail req) {
        ExperienceDetail res = new ExperienceDetail();
        res.setStartDate(req.getStartDate());
        res.setEndDate(req.getEndDate());
        res.setDescription(req.getDescription());
        return res;
    }

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

    @Transactional
    public UpdateCandidateCvResponse updateCv(String userId, UpdateCandidateCvRequest request) {
        try {
            Candidate candidate = candidateRepository.findById(userId)
                    .orElseGet(() -> {
                        User user = userRepository.findById(userId)
                                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
                        Candidate newCandidate = new Candidate();
                        newCandidate.setUser(user);
                        return newCandidate;
                    });

            if (request.getName() != null) candidate.setName(request.getName());
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
                candidateSkillRepository.deleteByCandidateId(userId);
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
            return getCv(userId);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            e.printStackTrace();
            throw new AppException(ErrorCode.INVALID_JSON_FORMAT);
        }
    }

    private void validateDegrees(List<DegreeRequest> degrees) {
        for (DegreeRequest d : degrees) {
            if (d.getType() == null) throw new AppException(ErrorCode.DEGREE_TYPE_REQUIRED);
            if ("DEGREE".equals(d.getType())) {
                if (d.getDegree() == null || d.getInstitution() == null)
                    throw new AppException(ErrorCode.INVALID_DEGREE);
            } else if ("CERTIFICATE".equals(d.getType())) {
                if (d.getName() == null) throw new AppException(ErrorCode.INVALID_CERTIFICATE);
            }
        }
    }

    private List<CandidateSkillRequest> mapLLMSkillsToRequests(List<CandidateSkillResponse> llmSkills) {
        if (llmSkills == null) return new ArrayList<>();
        List<CandidateSkillRequest> requests = new ArrayList<>();

        for (CandidateSkillResponse s : llmSkills) {
            if (s.getSkillName() == null) continue;
            skillRepository.findByNameContainingIgnoreCase(s.getSkillName().trim())
                    .stream().findFirst().ifPresent(skillEntity -> {
                        CandidateSkillRequest req = new CandidateSkillRequest();
                        req.setSkillId(skillEntity.getId());
                        req.setExperienceYears(s.getExperienceYears() != null ? s.getExperienceYears() : 1);
                        requests.add(req);
                    });
        }
        return requests;
    }

    private static final String SYSTEM_PROMPT = """
            Bạn là chuyên gia phân tích dữ liệu nhân sự cao cấp. 
            Nhiệm vụ: Trình bày thông tin từ văn bản CV (được trích xuất từ PDF) thành cấu trúc JSON chuẩn xác.
            
            Cấu trúc JSON yêu cầu:
            {
              "name": "Họ và tên",
              "address": "Địa chỉ liên lạc",
              "description": "Tóm tắt mục tiêu hoặc giới thiệu bản thân",
              "degrees": [
                {
                  "type": "DEGREE hoặc CERTIFICATE",
                  "degree": "Tên bằng cấp (nếu là DEGREE)",
                  "name": "Tên chứng chỉ (nếu là CERTIFICATE)",
                  "major": "Ngành học",
                  "institution": "Tên trường/tổ chức cấp",
                  "graduationYear": 2023 (năm tốt nghiệp dạng số)
                }
              ],
              "experience": [
                {
                  "startDate": "yyyy-MM-dd",
                  "endDate": "yyyy-MM-dd hoặc null nếu đang làm",
                  "description": "Chi tiết công việc và thành tựu"
                }
              ],
              "skills": [
                {
                  "skillName": "Tên kỹ năng (VD: Java, SQL, Communication)",
                  "experienceYears": 3 (Số năm kinh nghiệm, tự ước lượng dựa trên timeline làm việc)
                }
              ]
            }
            Quy tắc bắt buộc:
            1. Chỉ trả về JSON, tuyệt đối không có văn bản dẫn nhập hoặc giải thích.
            2. Định dạng ngày tháng: yyyy-MM-dd. Nếu chỉ có năm, hãy để yyyy-01-01.
            3. Làm sạch dữ liệu: Loại bỏ các ký tự rác từ PDF (@, *, -, bullet points không cần thiết).
            4. Ngôn ngữ: Giữ nguyên ngôn ngữ gốc của CV (Tiếng Anh hoặc Tiếng Việt).
            5. 'skills': Phải tách riêng từng kỹ năng rõ rệt để hệ thống dễ dàng mapping ID.
            """;

    public UpdateCandidateCvRequest handleCvOcrUpload(String userId, MultipartFile file) {

        String rawText = ocrService.scanFile(file);
        System.out.println(rawText);
        UpdateCandidateCvRequest updateRequest = parseRawText(rawText);
        System.out.println(updateRequest);
        return updateRequest;
    }

    public UpdateCandidateCvRequest parseRawText(String rawText) {
        // SỬA TẠI ĐÂY: Dùng đúng tên model có trong danh sách của bạn
        String modelName = "gemini-2.5-flash";
        // Dùng v1 vì đây là các bản stable
        String url = "https://generativelanguage.googleapis.com/v1/models/" + modelName + ":generateContent?key=" + apiKey;

        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        Map<String, Object> requestBody = Map.of(
                "contents", List.of(Map.of(
                        "parts", List.of(Map.of("text", SYSTEM_PROMPT + "\n\nCV TEXT FROM OCR:\n" + rawText))
                ))
        );

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            System.out.println("Connecting to Gemini API: " + url);

            // ĐỔI TẠI ĐÂY: Nhận phản hồi là String.class thay vì JsonNode.class
            org.springframework.http.ResponseEntity<String> responseEntity =
                    restTemplate.postForEntity(url, entity, String.class);

            String responseBody = responseEntity.getBody();

            if (responseBody == null) {
                throw new AppException(ErrorCode.INVALID_JSON_FORMAT);
            }

            // Dùng objectMapper (đã được Spring inject) để đọc String thành JsonNode
            JsonNode response = objectMapper.readTree(responseBody);

            if (!response.has("candidates")) {
                throw new AppException(ErrorCode.INVALID_JSON_FORMAT);
            }

            String aiRawResponse = response.path("candidates").get(0)
                    .path("content").path("parts").get(0)
                    .path("text").asText();

            String jsonStr = cleanJsonWithRegex(aiRawResponse);
            return convertLLMToRequest(objectMapper.readValue(jsonStr, LLMResumeResponse.class));

        } catch (Exception e) {
            System.err.println("Lỗi hệ thống: " + e.getMessage());
            throw new AppException(ErrorCode.INVALID_JSON_FORMAT);
        }
    }

    private String cleanJsonWithRegex(String raw) {
        if (raw == null || raw.isEmpty()) return "{}";

        // Tìm nội dung nằm giữa dấu ngoặc nhọn đầu tiên và cuối cùng
        Pattern pattern = Pattern.compile("\\{.*\\}", Pattern.DOTALL);
        Matcher matcher = pattern.matcher(raw);

        if (matcher.find()) {
            return matcher.group();
        }
        return raw.trim();
    }

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
                skillRepository.findByNameContainingIgnoreCase(skillNameFromAI)
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