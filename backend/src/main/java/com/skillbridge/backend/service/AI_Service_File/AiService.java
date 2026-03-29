package com.skillbridge.backend.service.AI_Service_File;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillbridge.backend.dto.request.OllamaRequest;
import com.skillbridge.backend.dto.request.OllamaOptions;
import com.skillbridge.backend.dto.response.OllamaResponse;
import com.skillbridge.backend.exception.ErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.servlet.View;

import java.util.Map;

@Service
public class AiService {

    private final RestClient ollamaRestClient;
    private final ObjectMapper objectMapper;
    private final View error;

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
    private static final String PROMPT_CHECK_APPROVAL = """
            Bạn là một chuyên gia kiểm duyệt nội dung tuyển dụng (Job Moderation AI). Nhiệm vụ của bạn là phân tích dữ liệu JSON của một Tin tuyển dụng (Job Description - JD) và quyết định xem bài đăng này có hợp lệ để hiển thị công khai hay không.
            
            Hãy đánh giá JD dựa trên các RÀNG BUỘC NGHIÊM NGẶT sau đây:
            
            1. TÍNH CÓ NGHĨA VÀ MẠCH LẠC (BẮT BUỘC):
            - Nội dung các trường `description`, hay các mô tả khác phải là ngôn ngữ tự nhiên, có ý nghĩa, liên quan trực tiếp đến việc làm.
            - KHÔNG chấp nhận các đoạn text spam (ví dụ: "asdasdasd", "test test"), chuỗi ký tự vô nghĩa, hoặc nội dung không mang thông tin tuyển dụng.
            
            2. KHÔNG CHỨA NỘI DUNG NHẠY CẢM HOẶC VI PHẠM (BẮT BUỘC):
            - Tuyệt đối KHÔNG chứa ngôn từ tục tĩu, xúc phạm, phân biệt đối xử (về giới tính, tôn giáo, chủng tộc).
            - Tuyệt đối KHÔNG chứa nội dung liên quan đến tình dục, bạo lực, cờ bạc, các hoạt động bất hợp pháp hoặc chính trị nhạy cảm.
            - Không chứa các đường link độc hại hoặc thông tin lừa đảo chiếm đoạt tài sản.
            
            3. TÍNH ĐẦY ĐỦ VÀ CHUYÊN NGHIỆP (BỔ SUNG):
            - JD phải có đủ các thông tin cốt lõi: Vị trí (`position`), Mô tả công việc, và Yêu cầu.
            - Mức lương (`salaryMin`, `salaryMax`) phải hợp lý (không được để số âm).
            
            4. TÍNH NHẤT QUÁN CỦA DỮ LIỆU (BỔ SUNG):
            - Kỹ năng yêu cầu (`skills`) phải có sự liên quan logic đến vị trí công việc (`position`)
            
            ĐỊNH DẠNG ĐẦU RA:
            Bạn phải trả về kết quả dưới định dạng JSON với cấu trúc sau:
            {
              "isApproved": true/false,
              "reason": "Giải thích ngắn gọn lý do tại sao đưa ra quyết định này, liệt kê các lỗi nếu có.",
              "flaggedKeywords": ["danh sách các từ nhạy cảm hoặc vô nghĩa phát hiện được, nếu có"]
            }
            """;
    public AiService(RestClient ollamaRestClient, ObjectMapper objectMapper, View error) {
        this.ollamaRestClient = ollamaRestClient;
        this.objectMapper = objectMapper;
        this.error = error;
    }

    public String analyzeSkillGap(Map<String, Object> cvData, Map<String, Object> jdData) {
        try {
            OllamaOptions options = OllamaOptions.builder()
                    .temperature(0.0) ///// Điều chỉnh mức độ sáng tạo của AI.
                    .top_k(10)   /// Giới hạn số lượng từ mà AI được cân nhắc khi sinh câu trả lời.
                    .top_p(0.95) ///      // Kiểm soát phạm vi xác suất của các từ được chọn (nucleus sampling).
                    .num_predict(1500)   /// Số lượng token tối đa AI có thể sinh ra trong một lần trả lời.
                    .num_ctx(8192) ///     // Kích thước ngữ cảnh (context) mà AI có thể ghi nhớ.
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
    public String Ai_OF_SKILLBRIDGE(String dataJD_of_Company, int type_Function){
        try{
            String finalPrompt = "";
            OllamaOptions options = OllamaOptions.builder()
                    .temperature(0.2)
                    .top_k(10)
                    .top_p(0.1)
                    .num_predict(2048)
                    .num_ctx(8192)
                    .build();
            ///  chức năng AI duyệt bài đăng
            if(type_Function == 1){
                finalPrompt = PROMPT_CHECK_APPROVAL +
                        "\n\n--- CV JSON ---\n" + dataJD_of_Company;
            }
            OllamaRequest requestAI = OllamaRequest.builder()
                    .model(model)
                    .prompt(finalPrompt)
                    .stream(false)
                    .format("json")
                    .options(options)
                    .build();
            OllamaResponse response = ollamaRestClient.post()
                    .uri("/api/generate")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestAI)
                    .retrieve()
                    .body(OllamaResponse.class);
            return response != null ? response.response() : "{}";

        } catch (Exception e) {
            e.printStackTrace(); // In ra log lỗi thực sự
            throw new RuntimeException("Lỗi thực sự là: " + e.getMessage(), e);
        }
        finally {
            System.out.println("Đã chạy xong chứ năng đánh giá bài đăng ");
        }
    }
}