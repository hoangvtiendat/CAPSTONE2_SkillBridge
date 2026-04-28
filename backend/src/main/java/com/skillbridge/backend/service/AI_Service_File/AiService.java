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
             Phân tích CV sau và trả về JSON chuẩn dựa trên danh sách ngành và kỹ năng cho sẵn.
                       \s
                        DANH SÁCH NGÀNH VÀ KỸ NĂNG TỪ HỆ THỐNG:
                        %s
                       \s
                        YÊU CẦU NGHIÊM NGẶT:
                        1. Chỉ trả về JSON, không giải thích.
                        2. Ánh xạ 'categoryId' từ danh sách ngành phù hợp nhất.
                        3. Với mỗi kỹ năng trong CV, hãy tìm 'skillId' tương ứng trong danh sách kỹ năng của ngành đó. Nếu không khớp 100%%, hãy chọn cái gần nhất.
                        4. Nếu mảng 'experience' hoặc 'skills' quá dài, hãy tóm tắt lại để đảm bảo JSON không bị cắt ngang.
                        5. Kiểm tra kỹ các dấu đóng ngoặc } và ] trước khi kết thúc.
                        6. Nếu endDate là hiện tại thì trả ngày hiện tại theo định dạng yyyy-MM-dd.
                       \s
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
                       \s
                        VĂN BẢN CV:
                        %s
                        ""\";
       """;
    private static final String PROMPT_CHECK_APPROVAL = """
    [SYSTEM ROLE]
            Bạn là AI kiểm duyệt nội dung tuyển dụng (Job Moderation AI) cho nền tảng SkillBridge.
            
            Nhiệm vụ của bạn là phân tích dữ liệu JSON của một tin tuyển dụng (Job Description - JD) và quyết định xem bài đăng có được phép hiển thị công khai hay không.
            
            ## Tiêu chí đánh giá:
            
            1. Spam cơ bản:
            - TỪ CHỐI nếu nội dung là chuỗi vô nghĩa (ví dụ: "asdfgh", "qwerty") hoặc test quá sơ sài ("test", "abc", "123").
            - CHẤP NHẬN nếu nội dung vẫn thể hiện được mục đích tuyển dụng, dù ngắn hoặc trình bày chưa tốt.
            
            2. An toàn nội dung:
            - TỪ CHỐI nếu chứa nội dung vi phạm pháp luật (lừa đảo, cờ bạc, mại dâm, đa cấp bất hợp pháp, v.v.).
            - TỪ CHỐI nếu có ngôn từ xúc phạm nghiêm trọng.
            - Bỏ qua các từ ngữ đời thường, không cần quá khắt khe.
            
            3. Tính hợp lệ thông tin:
            - Phải có thông tin vị trí công việc (job title).
            - Mức lương không được là số âm.
            - Không yêu cầu đầy đủ tất cả field, thiếu chi tiết vẫn có thể CHẤP NHẬN.
            
            4. Ngôn ngữ:
            - Địa chỉ tại Việt Nam phải viết bằng tiếng Việt.
            - Địa danh nước ngoài có thể dùng tiếng Anh.
            
            ## Kết luận:
            
            Trả về kết quả dưới dạng JSON với cấu trúc:
            
            {
              "isApproved": true hoặc false,
              "reason": "Nếu duyệt: 'Nội dung hợp lệ'. Nếu từ chối: ghi rõ lý do ngắn gọn.",
              "flaggedKeywords": ["các từ khóa vi phạm phát hiện được, nếu không có thì để []"]
            }
            
            Chỉ trả về JSON, không giải thích thêm.
    [INPUT DATA]
    """;
    private static final String PROMPT_CHECK_NEWJOV_VS_OLDJOB = """
YÊU CẦU:
So sánh 2 JD bằng NGỮ NGHĨA (không phải từ khóa) để xác định có SPAM (trùng lặp) hay không.

NGUYÊN TẮC:
- Dựa vào bản chất công việc, không dựa vào wording.
- Bỏ qua tên công ty.
- Nhận diện các thủ thuật: đổi từ, đảo câu, format khác → vẫn coi là giống.
- Hỗ trợ so sánh khác ngôn ngữ (Việt - Anh).

TIÊU CHÍ SO SÁNH:
1. Vị trí & chuyên môn
2. Cấp bậc (Junior, Senior,...)
3. Hình thức làm việc (Full-time, Part-time,...)
4. Địa điểm (hoặc Remote)
5. Trách nhiệm & yêu cầu chính
6. Lương & quyền lợi

KẾT LUẬN SPAM (true) nếu:
- Nội dung gần như giống nhau
- Chỉ đổi cách viết, từ đồng nghĩa, format
- Một bản là bản rút gọn / dịch của bản kia
- Đổi title nhưng bản chất công việc không đổi

KHÔNG SPAM (false) nếu:
- Khác cấp bậc
- Khác địa điểm / Remote
- Khác hình thức làm việc
- Khác rõ về yêu cầu, trách nhiệm hoặc lương
- Không chắc chắn → chọn false

OUTPUT (CHỈ JSON):
{
  "spam": true | false
}
""";
    private static final String SEMANTIC_SEARCH = """
VAI TRÒ BẮT BUỘC:
Bạn là API trích xuất dữ liệu lõi của ứng dụng SkillBridge. Nhiệm vụ DUY NHẤT của bạn là phân tích [DỮ LIỆU ĐẦU VÀO] và trả về MỘT khối JSON hợp lệ. TUYỆT ĐỐI KHÔNG giải thích, KHÔNG thêm văn bản.

CẤU TRÚC JSON BẮT BUỘC (KHÓA CHẶT):
Bạn CHỈ ĐƯỢC PHÉP trả về một JSON Object chứa ĐÚNG 5 keys sau đây. 
LỆNH CẤM: TUYỆT ĐỐI KHÔNG ĐƯỢC TẠO KEY MỚI. TUYỆT ĐỐI KHÔNG ĐƯỢC LẤY LỜI NÓI CỦA USER LÀM TÊN KEY.

1. "city" (String/null):
- Nếu User có nhắc địa điểm -> Lấy địa điểm đó.
- Nếu User KHÔNG nhắc -> BẮT BUỘC lấy Tỉnh/Thành phố từ trường "location" trong CV (Dịch sang Tiếng Việt, xóa ngày tháng, số nhà).

2. "salary_expect" (Integer/null): 
- Số tiền User mong muốn.

3. "category_name" (String/null): 
- Ưu tiên User. Nếu User không nhập ngành -> BẮT BUỘC lấy "category" từ CV.

4. "job_position" (String/null): 
- Chức danh chuẩn hóa (Frontend, Backend...).

5. "search_query" (String/null) - BẮT BUỘC ĐỌC KỸ LUẬT GÁN GIÁ TRỊ:
- TRƯỜNG HỢP A (Có từ khóa cá nhân): Nếu câu của User có các từ ("phù hợp", "cho tôi", "theo CV") -> Gán giá trị bằng: [Yêu cầu của User] + [Các kỹ năng (skills) có trong CV].
- TRƯỜNG HỢP B (Không có từ khóa cá nhân): -> Gán giá trị bằng: [Chỉ yêu cầu của User]. TUYỆT ĐỐI KHÔNG lấy CV.
- LỆNH CẤM TẠI ĐÂY: KHÔNG ĐƯỢC bịa thêm chữ. KHÔNG lấy tên Key là "phù hợp". CHỈ ĐƯỢC dùng key "search_query".

MẪU ĐẦU RA DUY NHẤT ĐƯỢC CHẤP NHẬN:
{
  "city": "Đà Nẵng",
  "salary_expect": null,
  "category_name": "Công nghệ thông tin",
  "job_position": null,
  "search_query": "được cấp máy tính, Triển khai Docker & Kubernetes, Hệ quản trị CSDL (MySQL, MongoDB), Lập trình Java (Spring Boot)"
}
--- BẮT ĐẦU DỮ LIỆU ĐẦU VÀO ---
""";
    private static final String SEMANTIC_SEARCH_2 = """
VAI TRÒ:
Bạn là hệ thống lọc dữ liệu logic. Nhiệm vụ: Đối soát [DANH SÁCH JD] với [YÊU CẦU NGƯỜI DÙNG] để tìm ra những JD thỏa mãn 100% điều kiện.

QUY TRÌNH XỬ LÝ (BẮT BUỘC):
1. Phân tách [YÊU CẦU NGƯỜI DÙNG] thành các tiêu chí riêng biệt (Ví dụ: "cấp máy tính" là tiêu chí A, "Java" là tiêu chí B...).
2. Với mỗi JD, bạn phải tạo một "Bảng kiểm" ngầm:
   - Nếu JD có nhắc đến "cấp máy tính" (Macbook, Laptop, thiết bị làm việc) -> ĐẠT tiêu chí A.
   - Nếu JD có nhắc đến "Docker/Kubernetes" -> ĐẠT tiêu chí B.
   ... (lặp lại cho mọi tiêu chí).
3. LUẬT LOẠI TRỪ (STRICT AND): 
   - Một JD CHỈ được đưa vào mảng "selected_ids" nếu nó ĐẠT TẤT CẢ các tiêu chí đã phân tách ở Bước 1.
   - CHỈ CẦN THIẾU 1 TIÊU CHÍ (Ví dụ: có Java nhưng không nhắc đến việc cấp máy tính) -> LOẠI BỎ JD đó ngay lập tức.

RÀNG BUỘC ĐẦU RA:
- Trả về JSON Object duy nhất: { "selected_ids": [số_thứ_tự] }.
- Không giải thích, không markdown. Nếu không có JD nào khớp 100%, trả về { "selected_ids": [] }.

--- DỮ LIỆU ĐỐI SOÁT ---
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
            System.out.println("cvJsonString: " + cvJsonString);
            String jdJsonString = objectMapper.writeValueAsString(jdData);
            System.out.println("jdJsonString: " + jdJsonString);

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

    public String optimizeCvText(String rawText) {
        if (rawText == null || rawText.isBlank()) return "";

        String cleaned = rawText.replaceAll("[—\u00a9\u00ae|©]", " ");

        cleaned = cleaned.replaceAll("\\n+", "\n");

        cleaned = cleaned.replaceAll("[ ]{2,}", " ");


        String[] keywords = {"CONTACT", "PROGRAMMING LANGUAGES", "CERTIFICATES", "About me",
                "Work Experiences", "Education", "Projects", "Prizes and Awards"};

        for (String key : keywords) {
            cleaned = cleaned.replace(key, "\n" + key.toUpperCase() + ": ");
        }

        return cleaned.trim();
    }

    public String parsingCV_AI(String dataCV_Of_Candidate){
        try{
            String optimizedText = optimizeCvText(dataCV_Of_Candidate);
            System.out.println("optimizedText: " + optimizedText);
            System.out.println(dataCV_Of_Candidate);
        OllamaOptions options = OllamaOptions.builder()
                .temperature(0.0)
                .top_k(10)
                .top_p(0.1)
                .num_predict(1500)
                .num_ctx(8192)
                .build();
        String finalPrompt = PROMPT_PARSING_CV +
                "\n\n--- CV JSON ---\n" + optimizedText;
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
    public String Ai_OF_SKILLBRIDGE(String data_Request, int type_Function){
        try{
            String finalPrompt = "";
            OllamaOptions options = OllamaOptions.builder()
                    .temperature(0.0)
                    .top_k(10)
                    .top_p(0.1)
                    .num_predict(2048)
                    .num_ctx(8192)
                    .build();
            ///  chức năng AI duyệt bài đăng
            if(type_Function == 1){
                // Trong aiService.Ai_OF_SKILLBRIDGE

                finalPrompt = PROMPT_CHECK_APPROVAL +
                        "\n\n[DỮ LIỆU CẦN KIỂM TRA]:\n\"\"\"\n" +
                        data_Request +
                        "\n\"\"\"\n\n" +
                        "CHỈ TRẢ VỀ JSON, KHÔNG ĐƯỢC NHẮC LẠI NỘI DUNG TRÊN.";
            }
            ///   Kiểm tra nâng cao của JD so sánh cũ + mới  !!!!!!!!!!!!!!!!!!!!!!
            else if(type_Function == 2){
                finalPrompt = PROMPT_CHECK_NEWJOV_VS_OLDJOB +
                        "\n\n--- Data ---\n" + data_Request;
            }
            ///  Bóc tách dữ liệu
            else if(type_Function == 3){
                finalPrompt = SEMANTIC_SEARCH +
                        "\n\n--- Data ---\n" + data_Request;
                System.out.println("dataSearch = " + data_Request);
            }
            else if(type_Function == 4){
                finalPrompt =SEMANTIC_SEARCH_2 + 
                        data_Request;
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
            throw new RuntimeException(ErrorCode.AI_EXITS.getMessage());
        }
        finally {
            System.out.println("Đã chạy xong chứ năng đánh giá bài đăng ");
        }
    }
}