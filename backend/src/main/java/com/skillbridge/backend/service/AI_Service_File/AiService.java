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
       VAI TRÒ:
                   Bạn là hệ thống AI phân tích yêu cầu tìm kiếm việc làm của nền tảng SkillBridge. Nhiệm vụ của bạn là bóc tách [YÊU CẦU TỪ NGƯỜI DÙNG] và [DỮ LIỆU CV HIỆN TẠI] để xuất ra một khối JSON duy nhất.
            
                   [QUY TẮC BẮT BUỘC]:
            
                   1. VỊ TRÍ & CẤP BẬC (JOB_POSITION):
                   - Chuẩn hóa viết tắt: f-e/FE -> Frontend, b-e/BE -> Backend, fs -> Fullstack, TTS -> Thực tập sinh, Jr -> Junior, Sr -> Senior.
                   - TUYỆT ĐỐI KHÔNG tự ý thêm cấp bậc (như Intern, Fresher) nếu người dùng không nhắc tới.
            
                   2. ĐỊA ĐIỂM (CITY):
                   - Chỉ lấy tên riêng (Ví dụ: "Hà Nội", "Đà Nẵng"). Bỏ từ "Thành phố", "TP".
                   - Nếu yêu cầu người dùng thiếu địa điểm, BẮT BUỘC lấy "location" từ [DỮ LIỆU CV HIỆN TẠI].
            
                   3. MỨC LƯƠNG (SALARY):
                   - Trả về số nguyên cụ thể (Ví dụ: 15 triệu -> 15000000).
                   - "Lương tháng 13/14" được tính là phúc lợi, không phải salary_expect -> để null.
            
                   4. LỌC KỸ NĂNG (CROSS-SKILL LOGIC):
                   - Nếu job_position TRÁI NGÀNH với CV: XÓA SẠCH kỹ năng trong CV. Tự sinh 3-5 kỹ năng chuẩn theo vị trí mới (Ví dụ: Tìm Frontend thì tự sinh HTML, CSS, ReactJS).
                   - Nếu CÙNG NGÀNH: Sử dụng kỹ năng từ CV.
            
                   5. SEARCH QUERY (VECTOR SEARCH):
                   - Viết duy nhất MỘT câu văn hoàn chỉnh theo công thức: [Kỹ năng đã lọc] + [Phúc lợi từ yêu cầu].
                   - CẤM: Không chứa địa điểm, không chứa mức lương bằng số, không chứa chức danh công việc trong câu này.
            
                   [DANH SÁCH CATEGORY HỆ THỐNG]:
                   (Hãy dán danh sách ID và Tên Category của bạn vào đây)
            
                   [ĐỊNH DẠNG ĐẦU RA (JSON STRICT)]:
                   Chỉ trả về JSON, không giải thích gì thêm.
                   {
                     "city": "Tên thành phố hoặc null",
                     "salary_expect": số nguyên hoặc null,
                     "category_name": "Tên category khớp nhất",
                     "job_position": "Chức danh đã chuẩn hóa",
                     "search_query": "Câu văn mô tả kỹ năng và phúc lợi,... "
                   }
            --- DỮ LIỆU PHÂN TÍCH ĐÂY ---

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
    public String Ai_OF_SKILLBRIDGE(String dataJD_of_Company, int type_Function){
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
                        dataJD_of_Company +
                        "\n\"\"\"\n\n" +
                        "CHỈ TRẢ VỀ JSON, KHÔNG ĐƯỢC NHẮC LẠI NỘI DUNG TRÊN.";
            }
            ///   Kiểm tra nâng cao của JD so sánh cũ + mới  !!!!!!!!!!!!!!!!!!!!!!
            else if(type_Function == 2){
                finalPrompt = PROMPT_CHECK_NEWJOV_VS_OLDJOB +
                        "\n\n--- Data ---\n" + dataJD_of_Company;
            }
            ///  Bóc tách dữ liệu
            else if(type_Function == 3){
                finalPrompt = SEMANTIC_SEARCH +
                        "\n\n--- Data ---\n" + dataJD_of_Company;
                System.out.println("dataSearch = " + dataJD_of_Company);
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