package com.skillbridge.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillbridge.backend.config.KeywordConfig;
import com.skillbridge.backend.dto.request.CandidateSkillRequest;
import com.skillbridge.backend.dto.request.DegreeRequest;
import com.skillbridge.backend.dto.request.UpdateCandidateCvRequest;
import com.skillbridge.backend.dto.response.CandidateSkillResponse;
import com.skillbridge.backend.dto.response.DegreeResponse;
import com.skillbridge.backend.dto.response.UpdateCandidateCvResponse;
import com.skillbridge.backend.entity.*;
import com.skillbridge.backend.enums.SkillLevel;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.repository.*;
import jakarta.annotation.PostConstruct;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.io.InputStream;
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

    public UpdateCandidateCvResponse getCv(String userId) {
        Candidate candidate = candidateRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        List<DegreeResponse> degreeResponses = null;
        List<CandidateSkillResponse> skillResponses = null;
        if (candidate.getDegree() != null) {
            try {
                String degreeJson = String.valueOf(candidate.getDegree());
                List<DegreeRequest> degreesList = objectMapper.readValue(
                        degreeJson,
                        new com.fasterxml.jackson.core.type.TypeReference<List<DegreeRequest>>() {}
                );
                degreeResponses = degreesList.stream().map(this::toDegreeResponse).toList();
            } catch (JsonProcessingException e) {
                System.out.println("Failed to deserialize degrees: " + e.getMessage());
            }
        }
        List<CandidateSkill> currentSkills = candidateSkillRepository.findByCandidate(candidate);
        skillResponses = currentSkills.stream().map(s -> new CandidateSkillResponse(
                s.getSkill().getId(),
                s.getSkill().getName(),
                s.getExperienceYears(),
                s.getLevel()
        )).toList();
        return new UpdateCandidateCvResponse(
                candidate.getUser().getId(),
                candidate.getOpenToWork(),
                candidate.getYearsOfExperience(),
                candidate.getExpectedSalary(),
                candidate.getCategory() != null ? candidate.getCategory().getId() : null,
                candidate.getCategory() != null ? candidate.getCategory().getName() : null,
                degreeResponses,
                skillResponses
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
                        System.out.println("Creating new candidate profile for userId: " + userId);
                        return newCandidate;
                    });
            if (request.getOpenToWork() != null) candidate.setOpenToWork(request.getOpenToWork());
            if (request.getYearsOfExperience() != null) candidate.setYearsOfExperience(request.getYearsOfExperience());
            if (request.getExpectedSalary() != null) candidate.setExpectedSalary(request.getExpectedSalary());
            if (request.getCategoryId() != null) {
                Category category = categoryRepository.findById(request.getCategoryId())
                        .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
                candidate.setCategory(category);
            }
            if (request.getDegrees() != null) {
                validateDegrees(request.getDegrees());
                candidate.setDegree(objectMapper.writeValueAsString(request.getDegrees()));
            }
            if (request.getSkills() != null) {
                candidateSkillRepository.deleteByCandidate(candidate);
                candidateSkillRepository.flush();

                List<CandidateSkill> newSkills = request.getSkills().stream().map(sReq -> {
                    Skill skillEntity = skillRepository.findById(sReq.getSkillId())
                            .orElseThrow(() -> new AppException(ErrorCode.INVALID_KEY));
                    CandidateSkill cs = new CandidateSkill();
                    cs.setCandidate(candidate);
                    cs.setSkill(skillEntity);
                    cs.setExperienceYears(sReq.getExperienceYears());
                    cs.setLevel(sReq.getLevel());
                    return cs;
                }).toList();
                List<CandidateSkill> savedSkills = candidateSkillRepository.saveAll(newSkills);
                candidateSkillRepository.flush();
            }
            List<DegreeResponse> degreeResponses = null;
            List<CandidateSkillResponse> skillResponses = null;
            if (candidate.getDegree() != null) {
                try {
                    String degreeJson = String.valueOf(candidate.getDegree());
                    List<DegreeRequest> degreesList = objectMapper.readValue(
                            degreeJson,
                            new com.fasterxml.jackson.core.type.TypeReference<List<DegreeRequest>>() {}
                    );
                    degreeResponses = degreesList.stream().map(this::toDegreeResponse).toList();
                } catch (JsonProcessingException e) {
                    System.out.println("Failed to deserialize degrees: " + e.getMessage());
                }
            }
            List<CandidateSkill> currentSkills = candidateSkillRepository.findByCandidate(candidate);
            skillResponses = currentSkills.stream().map(s -> new CandidateSkillResponse(
                    s.getSkill().getId(),
                    s.getSkill().getName(),
                    s.getExperienceYears(),
                    s.getLevel()
            )).toList();
            return new UpdateCandidateCvResponse(
                    candidate.getUser().getId(),
                    candidate.getOpenToWork(),
                    candidate.getYearsOfExperience(),
                    candidate.getExpectedSalary(),
                    candidate.getCategory() != null ? candidate.getCategory().getId() : null,
                    candidate.getCategory() != null ? candidate.getCategory().getName() : null,
                    degreeResponses,
                    skillResponses
            );
        } catch (JsonProcessingException e) {
           System.out.println("Failed to serialize degrees JSON"+ e);
            throw new AppException(ErrorCode.INVALID_JSON_FORMAT);
        }
    }

    private DegreeResponse toDegreeResponse(DegreeRequest req) {
        DegreeResponse res = new DegreeResponse();
        res.setType(req.getType());
        res.setDegree(req.getDegree());
        res.setMajor(req.getMajor());
        res.setInstitution(req.getInstitution());
        res.setGraduationYear(req.getGraduationYear());
        res.setName(req.getName());
        res.setYear(req.getYear());
        return res;
    }

    private void validateDegrees(List<DegreeRequest> degrees) {
        for (DegreeRequest d : degrees) {
            if (d.getType() == null) {
                throw new AppException(ErrorCode.DEGREE_TYPE_REQUIRED);
            }
            switch (d.getType()) {
                case "DEGREE" -> {
                    if (d.getDegree() == null ||
                            d.getInstitution() == null ||
                            d.getGraduationYear() == null) {
                        throw new AppException(ErrorCode.INVALID_DEGREE);
                    }
                }
                case "CERTIFICATE" -> {
                    if (d.getName() == null || d.getYear() == null) {
                        throw new AppException(ErrorCode.INVALID_CERTIFICATE);
                    }
                }
                default -> throw new AppException(ErrorCode.INVALID_DEGREE_TYPE);
            }
        }
    }

    public UpdateCandidateCvRequest parseRawText(String rawText) {
        UpdateCandidateCvRequest request = new UpdateCandidateCvRequest();
        String cleanText = rawText.replaceAll("[|⁄\\\\@==]", " ").replaceAll("\\s+", " ");
        String lowerText = cleanText.toLowerCase();

        request.setOpenToWork(true);
        request.setYearsOfExperience(extractTotalExperience(lowerText));
        request.setExpectedSalary(extractSalary(lowerText));
        request.setDegrees(extractDegreesAndCertificates(rawText));
        request.setSkills(extractSkills(cleanText));

        return request;
    }

    private Integer extractTotalExperience(String text) {
        Pattern pattern = Pattern.compile("(\\d+)\\s*(year|năm|exp|yoe)");
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) return Integer.parseInt(matcher.group(1));

        Pattern yearRange = Pattern.compile("(19|20)\\d{2}\\s*[-–]\\s*((19|20)\\d{2}|present|nay|hiện tại)");
        Matcher rangeMatcher = yearRange.matcher(text);
        int maxDiff = 0;
        while (rangeMatcher.find()) {
            int start = Integer.parseInt(rangeMatcher.group(1));
            String endStr = rangeMatcher.group(2);
            int end = endStr.matches("\\d+") ? Integer.parseInt(endStr) : 2026;
            maxDiff = Math.max(maxDiff, end - start);
        }
        return maxDiff;
    }

    private List<DegreeRequest> extractDegreesAndCertificates(String rawText) {
        List<DegreeRequest> results = new ArrayList<>();
        String[] lines = rawText.split("\\r?\\n");

        String[] degreeKeywords = {"bachelor", "cử nhân", "engineer", "kỹ sư", "master", "thạc sĩ", "university", "đại học", "college", "cao đẳng"};
        String[] certKeywords = {"certificate", "chứng chỉ", "certified", "award", "prize", "ielts", "toeic", "jlpt", "oracle"};

        for (String line : lines) {
            String l = line.toLowerCase().trim();
            if (l.isEmpty()) continue;

            if (Arrays.stream(degreeKeywords).anyMatch(l::contains)) {
                DegreeRequest d = new DegreeRequest();
                d.setType("DEGREE");
                d.setInstitution(line.replaceAll("^[-•@*\\s]+", "").trim());
                d.setDegree(l.contains("bachelor") || l.contains("cử nhân") ? "Bachelor" : "Engineer");
                d.setMajor(l.contains("information technology") ? "Information Technology" : null);
                String year = extractYear(l);
                if (year != null) d.setGraduationYear(Integer.parseInt(year));
                results.add(d);
            } else if (Arrays.stream(certKeywords).anyMatch(l::contains)) {
                DegreeRequest c = new DegreeRequest();
                c.setType("CERTIFICATE");
                c.setName(line.replaceAll("^[-•@*\\s]+", "").trim());
                String year = extractYear(l);
                if (year != null) c.setYear(Integer.parseInt(year));
                results.add(c);
            }
        }
        return results;
    }

    private List<CandidateSkillRequest> extractSkills(String cleanText) {
        List<CandidateSkillRequest> skillRequests = new ArrayList<>();
        List<Skill> allSkills = skillRepository.findAll();
        String normalizedText = " " + cleanText.toLowerCase() + " ";

        for (Skill skill : allSkills) {
            String sName = skill.getName().toLowerCase();
            String regex = "\\b" + Pattern.quote(sName) + "\\b";
            if (Pattern.compile(regex).matcher(normalizedText).find()) {
                CandidateSkillRequest sReq = new CandidateSkillRequest();
                sReq.setSkillId(skill.getId());
                sReq.setLevel(determineSkillLevel(cleanText, sName));
                sReq.setExperienceYears(1);
                skillRequests.add(sReq);
            }
        }
        return skillRequests;
    }

    private SkillLevel determineSkillLevel(String text, String skillName) {
        String lowerText = text.toLowerCase();
        // Expert keywords
        if (lowerText.contains("expert") || lowerText.contains("architect") || lowerText.contains("lead") || lowerText.contains("master")) {
            return SkillLevel.EXPERT;
        }
        // Senior keywords
        if (lowerText.contains("senior") || lowerText.contains("advanced") || lowerText.contains("professional")) {
            return SkillLevel.SENIOR;
        }
        // Default
        return SkillLevel.JUNIOR;
    }

    private String extractYear(String text) {
        Matcher m = Pattern.compile("(19|20)\\d{2}").matcher(text);
        return m.find() ? m.group() : null;
    }

    private Double extractSalary(String text) {
        Pattern p = Pattern.compile("(salary|lương|expected)[:\\s]*\\$?(\\d+[.,]?\\d*)");
        Matcher m = p.matcher(text);
        if (m.find()) {
            try {
                return Double.parseDouble(m.group(2).replace(",", ""));
            } catch (Exception e) { return 0.0; }
        }
        return 0.0;
    }
}