package com.skillbridge.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
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
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
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

    public CandidateService(CandidateRepository candidateRepository,
                            CategoryRepository categoryRepository,
                            UserRepository userRepository,
                            SkillRepository skillRepository,
                            CandidateSkillRepository candidateSkillRepository,
                            ObjectMapper objectMapper) {
        this.candidateRepository = candidateRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
        this.skillRepository = skillRepository;
        this.candidateSkillRepository = candidateSkillRepository;
        this.objectMapper = objectMapper;
    }

    private List<DegreeResponse> deserializeDegrees(Object degreeObj) {
        if (degreeObj == null) return new ArrayList<>();
        try {
            String json = degreeObj instanceof String ? (String) degreeObj : objectMapper.writeValueAsString(degreeObj);
            List<DegreeRequest> list = objectMapper.readValue(json, new TypeReference<List<DegreeRequest>>() {});
            return list.stream().map(this::toDegreeResponse).toList();
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private List<ExperienceDetail> deserializeExperience(Object expObj) {
        if (expObj == null) return new ArrayList<>();
        try {
            if (expObj instanceof List) {
                return objectMapper.convertValue(expObj, new TypeReference<List<ExperienceDetail>>() {});
            }
            String json = expObj.toString();
            return objectMapper.readValue(json, new TypeReference<List<ExperienceDetail>>() {});
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
            CandidateSkillResponse res = new CandidateSkillResponse(s.getSkill().getId(),s.getExperienceYears());
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
    private String cleanLine(String line) {
        if (line == null) return "";
        // Loại bỏ các ký tự đặc biệt đứng đầu dòng thường gặp trong CV rác
        return line.replaceAll("^[*•\\-$@|⁄\\\\=]+", "").trim();
    }
    public UpdateCandidateCvRequest parseRawText(String rawText) {
        UpdateCandidateCvRequest request = new UpdateCandidateCvRequest();
        String[] lines = rawText.split("\\r?\\n");

        // Tìm tên: Thường là dòng in hoa, không chứa từ khóa mục lục
        List<String> blackList = Arrays.asList("about", "experience", "education", "skills", "contact", "summary", "profile");

        for (String line : lines) {
            String cleaned = cleanLine(line);
            if (cleaned.length() > 3 && !blackList.contains(cleaned.toLowerCase())) {
                request.setName(cleaned);
                break;
            }
        }

        // Địa chỉ: Lấy dòng chứa "Da Nang" nhưng cắt bớt phần thừa
        for (String line : lines) {
            if (line.toLowerCase().contains("da nang") || line.toLowerCase().contains("đà nẵng")) {
                String addr = cleanLine(line);
                if (addr.contains(",")) {
                    // Thường địa chỉ kết thúc sau tỉnh thành, phần sau là mô tả thừa
                    request.setAddress(addr.split(",")[0] + ", Da Nang");
                } else {
                    request.setAddress(addr);
                }
                break;
            }
        }

        request.setExperience(extractExperiences(rawText));
        request.setDegrees(extractDegreesAndCertificates(rawText));
        request.setSkills(extractSkills(rawText));

        return request;
    }

    private List<ExperienceDetail> extractExperiences(String text) {
        List<ExperienceDetail> experiences = new ArrayList<>();
        // Regex chặt chẽ hơn cho năm: yêu cầu đủ 4 chữ số
        Pattern yearPattern = Pattern.compile("\\b(19|20)\\d{2}\\b");
        String[] lines = text.split("\\r?\\n");

        for (int i = 0; i < lines.length; i++) {
            String line = lines[i];
            Matcher matcher = yearPattern.matcher(line);

            if (matcher.find()) {
                try {
                    int startYear = Integer.parseInt(matcher.group());
                    if (startYear < 1950 || startYear > 2030) continue; // Loại bỏ số rác

                    ExperienceDetail exp = new ExperienceDetail();
                    exp.setStartDate(LocalDate.of(startYear, 1, 1));

                    // Tìm năm kết thúc trong cùng dòng
                    int endYear = 2026;
                    if (matcher.find()) {
                        endYear = Integer.parseInt(matcher.group());
                    } else if (line.toLowerCase().matches(".*(present|nay|today|hiện tại).*")) {
                        endYear = 2026;
                    }

                    exp.setEndDate(LocalDate.of(endYear, 1, 1));

                    // Làm sạch mô tả: Lấy phần text còn lại của dòng hoặc dòng tiếp theo
                    String desc = cleanLine(line.replaceAll("\\b\\d{4}\\b", "").replaceAll("[-–/]", ""));
                    if (desc.length() < 5 && i + 1 < lines.length) {
                        desc = cleanLine(lines[i+1]);
                    }

                    // Chỉ thêm nếu mô tả không chứa từ khóa học vấn (để tránh trùng lặp)
                    if (!desc.toLowerCase().contains("university") && !desc.toLowerCase().contains("đại học")) {
                        exp.setDescription(desc);
                        experiences.add(exp);
                    }
                } catch (Exception e) {}
            }
        }
        return experiences;
    }

    private List<DegreeRequest> extractDegreesAndCertificates(String rawText) {
        List<DegreeRequest> results = new ArrayList<>();
        String[] lines = rawText.split("\\r?\\n");

        for (String line : lines) {
            String cleaned = cleanLine(line);
            String l = cleaned.toLowerCase();

            if (cleaned.length() < 5 || cleaned.length() > 100) continue; // Bỏ qua dòng quá ngắn hoặc quá dài (đoạn văn)

            if (l.contains("university") || l.contains("đại học")) {
                // Nếu dòng chứa cả "IELTS" và "University" thì ưu tiên là Certificate
                if (l.contains("ielts") || l.contains("toeic")) continue;

                DegreeRequest d = new DegreeRequest();
                d.setType("DEGREE");
                d.setInstitution(cleaned);
                d.setDegree(l.contains("bachelor") ? "Bachelor" : "Engineer");
                d.setMajor("Information Technology");
                results.add(d);
            } else if (l.contains("certified") || l.contains("chứng chỉ") || l.contains("ielts") || l.contains("certificate")) {
                if (l.equals("certificates")) continue; // Bỏ qua tiêu đề mục

                DegreeRequest c = new DegreeRequest();
                c.setType("CERTIFICATE");
                c.setName(cleaned);
                results.add(c);
            }
        }
        return results;
    }

    private List<CandidateSkillRequest> extractSkills(String cleanText) {
        List<CandidateSkillRequest> skillRequests = new ArrayList<>();
        List<Skill> allSkills = skillRepository.findAll();
        String normalizedText = cleanText.toLowerCase();

        for (Skill skill : allSkills) {
            String skillName = skill.getName().toLowerCase();
            if (normalizedText.contains(" " + skillName + " ") || normalizedText.contains("," + skillName)) {
                CandidateSkillRequest sReq = new CandidateSkillRequest();
                sReq.setSkillId(skill.getId());
                sReq.setExperienceYears(1);
                skillRequests.add(sReq);
            }
        }
        return skillRequests;
    }
}