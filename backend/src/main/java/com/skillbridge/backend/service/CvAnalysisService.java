package com.skillbridge.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillbridge.backend.dto.response.CvAnalysisResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;
@Service
@RequiredArgsConstructor
public class CvAnalysisService {

    private final AiService aiService;
    private final ObjectMapper objectMapper;

    public CvAnalysisResponse analyzeCvAgainstJob(Object cv, Object jd) {
        try {
            String cvStr = objectMapper.writeValueAsString(cv);
            String jdStr = objectMapper.writeValueAsString(jd);

            String prompt = String.format("""
                Bạn là chuyên gia nhân sự. Hãy phân tích CV dựa trên JD sau:
                [CV]: %s
                [JD]: %s
                
                Yêu cầu trả về JSON chính xác:
                1. matched_skills: Kỹ năng ứng viên có mà JD cần.
                2. missing_skills: Kỹ năng JD cần mà ứng viên thiếu.
                3. irrelevant_skills: Kỹ năng ứng viên có nhưng JD không cần.
                4. summary: Nhận xét ngắn gọn (1 câu).
                5. fit_score: Điểm phù hợp từ 0-100 dựa trên số kỹ năng khớp.
                
                CHỈ TRẢ VỀ JSON, KHÔNG GIẢI THÍCH.
                """, cvStr, jdStr);

            String rawJson = aiService.callAi(prompt);

            if (rawJson == null || rawJson.trim().isEmpty()) {
                throw new RuntimeException("AI không phản hồi hoặc trả về chuỗi rỗng");
            }

            return objectMapper.readValue(rawJson, CvAnalysisResponse.class);

        } catch (Exception e) {
            e.printStackTrace();
            return new CvAnalysisResponse(
                    List.of(), List.of(), List.of(),
                    "Lỗi xử lý dữ liệu AI: " + e.getMessage(), 0
            );
        }
    }
}