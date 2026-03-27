package com.skillbridge.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillbridge.backend.dto.request.OllamaRequest;
import com.skillbridge.backend.dto.request.OllamaOptions;
import com.skillbridge.backend.dto.response.OllamaResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import java.util.Map;

@Service
public class AiService {

    private final RestClient ollamaRestClient;
    private final ObjectMapper objectMapper;

    @Value("${ai.ollama.model}")
    private String model;

    private static final String SYSTEM_PROMPT_CHECK_CV_AND_JD =
            """
                    {
                              "match_score": 0,
                              "gap_percentage": 0,
                              "gap_analysis_summary": "Tóm tắt phân tích sự phù hợp giữa kỹ năng hiện có và yêu cầu công việc.",
                              "competency_matrix": [
                                {
                                  "skill_name": "Tên kỹ năng",
                                  "jd_required_level": 0,
                                  "cv_current_level": 0,
                                  "status": "MET | GAP | MISSING"
                                }
                              ],
                              "learning_roadmap": [
                                {
                                  "skill_to_upgrade": "Tên kỹ năng cần nâng cấp",
                                  "current_level": 0,
                                  "target_level": 0,
                                  "recommended_courses_or_actions": [
                                    "Hành động hoặc khóa học gợi ý 1",
                                    "Hành động hoặc khóa học gợi ý 2"
                                  ]
                                }
                              ],
                              "can_apply": false
                            }
            """;
    private static final String PROMPT_PARSING_CV = """
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
    public AiService(RestClient ollamaRestClient, ObjectMapper objectMapper) {
        this.ollamaRestClient = ollamaRestClient;
        this.objectMapper = objectMapper;
    }

    public String analyzeSkillGap(Map<String, Object> cvData, Map<String, Object> jdData) {
        try {
            OllamaOptions options = OllamaOptions.builder()
                    .temperature(0.0)
                    .top_k(10)
                    .top_p(0.1)
                    .num_predict(1500)
                    .num_ctx(8192)
                    .build();

            String cvJsonString = objectMapper.writeValueAsString(cvData);
            String jdJsonString = objectMapper.writeValueAsString(jdData);

            String finalPrompt = SYSTEM_PROMPT_CHECK_CV_AND_JD +
                    "\n\n--- JD JSON ---\n" + jdJsonString +
                    "\n\n--- CV JSON ---\n" + cvJsonString;

            OllamaRequest requestPayload = OllamaRequest.builder()
                    .model(model)
                    .prompt(finalPrompt)
                    .stream(false)
                    .format("json")
                    .options(options)
                    .build();

            OllamaResponse response = ollamaRestClient.post()
                    .uri("/api/generate")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestPayload)
                    .retrieve()
                    .body(OllamaResponse.class);

            return response != null ? response.response() : "{}";

        } catch (Exception e) {
            e.printStackTrace();
            return "{}";
        }
    }
    public String parsingCV_AI(String dataCV_Of_Candidate){
        try{
        OllamaOptions options = OllamaOptions.builder()
                .temperature(0.0)
                .top_k(10)
                .top_p(0.1)
                .num_predict(1500)
                .num_ctx(8192)
                .build();
        String finalPrompt = PROMPT_PARSING_CV +
                "\n\n--- CV JSON ---\n" + dataCV_Of_Candidate;
        OllamaRequest requestPayload = OllamaRequest.builder()
                .model(model)
                .prompt(finalPrompt)
                .stream(false)
                .format("json")
                .options(options)
                .build();
        OllamaResponse response = ollamaRestClient.post()
                .uri("/api/generate")
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestPayload)
                .retrieve()
                .body(OllamaResponse.class);

        return response != null ? response.response() : "{}";

    } catch (Exception e) {
        e.printStackTrace();
        return "{}";
    }
    }
}