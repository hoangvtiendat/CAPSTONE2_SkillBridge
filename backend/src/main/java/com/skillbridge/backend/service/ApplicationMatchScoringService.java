package com.skillbridge.backend.service;

import com.skillbridge.backend.dto.response.AiJobMatchScoreResponse;
import com.skillbridge.backend.entity.Application;
import com.skillbridge.backend.entity.Candidate;
import com.skillbridge.backend.entity.Job;
import com.skillbridge.backend.repository.JobRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Computes 0–100 suitability of an application against a job via Gemini (single numeric field).
 */
@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ApplicationMatchScoringService {

    GeminiService geminiService;
    JobRepository jobRepository;

    private static String truncate(String s, int max) {
        if (s == null || s.isBlank()) {
            return "";
        }
        String t = s.trim();
        if (t.length() <= max) {
            return t;
        }
        return t.substring(0, max) + "\n...[truncated]";
    }

    /**
     * @return match score in [0, 100]
     */
    public float computeMatchScore(Job job, Application application, Candidate candidate) {
        String jobJson = jobRepository.getJobAsJson(job.getId());
        if (jobJson == null) {
            jobJson = "{}";
        }

        StringBuilder applicant = new StringBuilder();
        applicant.append("Họ tên trên đơn: ").append(application.getFullName()).append('\n');
        applicant.append("Email: ").append(application.getEmail()).append('\n');
        if (application.getRecommendationLetter() != null && !application.getRecommendationLetter().isBlank()) {
            applicant.append("Thư giới thiệu: ")
                    .append(truncate(application.getRecommendationLetter(), 2500))
                    .append('\n');
        }
        if (application.getQualifications() != null && !application.getQualifications().isBlank()) {
            applicant.append("Qualifications (snapshot): ")
                    .append(truncate(application.getQualifications(), 4000))
                    .append('\n');
        }
        if (application.getParsedContentJson() != null && !application.getParsedContentJson().isBlank()) {
            applicant.append("Nội dung hồ sơ/CV đã gửi (JSON): ")
                    .append(truncate(application.getParsedContentJson(), 10000))
                    .append('\n');
        }
        if (candidate.getDescription() != null && !candidate.getDescription().isBlank()) {
            applicant.append("Mô tả profile ứng viên (hệ thống): ")
                    .append(truncate(candidate.getDescription(), 2000))
                    .append('\n');
        }

        String prompt = """
                Bạn là chuyên gia tuyển dụng. Nhiệm vụ: cho MỘT số matchScore từ 0 đến 100 thể hiện mức độ phù hợp của ỨNG VIÊN với TIN TUYỂN DỤNG (JD).
                - 0–40: kém phù hợp
                - 41–60: trung bình
                - 61–80: tốt
                - 81–100: rất phù hợp
                Chỉ trả về JSON hợp lệ, một object duy nhất, không markdown, không text ngoài JSON:
                {"matchScore": number}
                matchScore phải là số thực từ 0 đến 100.

                --- TIN TUYỂN DỤNG (JSON) ---
                %s

                --- HỒ SƠ ỨNG TUYỂN ---
                %s
                """.formatted(jobJson, applicant);

        AiJobMatchScoreResponse response = geminiService.callGemini(prompt, AiJobMatchScoreResponse.class);
        double raw = response.getMatchScore() != null ? response.getMatchScore() : 0.0;
        if (Double.isNaN(raw) || Double.isInfinite(raw)) {
            raw = 0.0;
        }
        float clamped = (float) Math.max(0.0, Math.min(100.0, raw));
        log.info("[AI_MATCH] job={} application={} score={}", job.getId(), application.getId(), clamped);
        return clamped;
    }
}
