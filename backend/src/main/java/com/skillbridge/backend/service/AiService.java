package com.skillbridge.backend.service;


import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillbridge.backend.dto.request.OllamaOptions;
import com.skillbridge.backend.dto.request.OllamaRequest;
import com.skillbridge.backend.dto.response.OllamaResponse;
import com.skillbridge.backend.dto.response.SkillAnalysisResult;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class AiService {
    private final RestClient restClient;
    @Value("${ai.ollama.model}")
    private String aiModel;

    //Taoj RestCilent
    public AiService(@Value("${ai.ollama.url}") String ollamaUrl) {
        this.restClient = RestClient.builder()
                .baseUrl(ollamaUrl)
                .build();
    }
    public String analyzeAndScoreSkills(String candidateSkills, String jobRequirements) {

        String systemPrompt = """
            Bạn là một hệ thống trích xuất dữ liệu tuyển dụng.
            Nhiệm vụ của bạn là đối chiếu "Kỹ năng ứng viên" với "Yêu cầu công việc (JD)" và phân loại thành ĐÚNG 3 mảng:
            
            1. "matched_skills": Các kỹ năng công nghệ JD YÊU CẦU và ứng viên ĐÃ CÓ.
            2. "missing_skills": Các kỹ năng công nghệ JD YÊU CẦU nhưng ứng viên ĐANG THIẾU.
            3. "irrelevant_skills": Các kỹ năng ứng viên có NHƯNG JD KHÔNG HỀ YÊU CẦU (kỹ năng dư thừa).
            
            --- VÍ DỤ CHUẨN ---
            Kỹ năng ứng viên: {"languages": ["Python", "Java"]}
            Yêu cầu công việc: Cần dev biết Java, Spring Boot, MySQL.
            Kết quả JSON:
            {
                "matched_skills": ["Java"],
                "missing_skills": ["Spring Boot", "MySQL"],
                "irrelevant_skills": ["Python"]
            }
            -------------------
            
            QUAN TRỌNG: CHỈ TRẢ VỀ ĐÚNG 1 CHUỖI JSON. KHÔNG GIẢI THÍCH GÌ THÊM.
            """;

        String fullPrompt = systemPrompt
                + "\n--- Kỹ năng của ứng viên ---\n" + candidateSkills
                + "\n\n--- Bài viết yêu cầu công việc (JD) ---\n" + jobRequirements;

        OllamaOptions options = new OllamaOptions(0.0, 42);

        OllamaRequest requestPayload = OllamaRequest.builder()
                .model(aiModel)
                .prompt(fullPrompt)
                .stream(false)
                .format("json")
                .options(options)
                .build();

        try {
            OllamaResponse response = restClient.post()
                    .uri("/api/generate")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestPayload)
                    .retrieve()
                    .body(OllamaResponse.class);

            String aiJsonResult = response != null ? response.response() : "{}";


            return calculateScoreWithJava(aiJsonResult);

        } catch (Exception e) {
            e.printStackTrace();
            return "Lỗi xử lý hệ thống";
        }

    }
    private String calculateScoreWithJava(String aiJsonResult) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            SkillAnalysisResult analysis = objectMapper.readValue(aiJsonResult, SkillAnalysisResult.class);

            int matchedCount = analysis.matched_skills() != null ? analysis.matched_skills().size() : 0;
            int missingCount = analysis.missing_skills() != null ? analysis.missing_skills().size() : 0;
            int totalRequiredSkills = matchedCount + missingCount;

            int finalScore = 0;
            if (totalRequiredSkills > 0) {
                finalScore = (int) Math.round(((double) matchedCount / totalRequiredSkills) * 100);
            }

            return String.format("Ứng viên đáp ứng %d%% yêu cầu. (Có: %s | Thiếu: %s)",
                    finalScore,
                    analysis.matched_skills(),
                    analysis.missing_skills());

        } catch (Exception e) {
            e.printStackTrace();
            return "Lỗi khi tính toán điểm số từ dữ liệu AI";
        }
    }
}

