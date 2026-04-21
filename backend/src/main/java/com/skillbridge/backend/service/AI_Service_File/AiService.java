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
            Bạn là hệ thống AI phân tích yêu cầu tìm kiếm việc làm của nền tảng SkillBridge.
            Nhiệm vụ của bạn là phân tích [YÊU CẦU TỪ NGƯỜI DÙNG] và [DỮ LIỆU CV HIỆN TẠI] để xuất ra định dạng JSON chuẩn.
            
            [QUY TẮC BẢO MẬT PHIÊN LÀM VIỆC (STATELESS) - TỐI QUAN TRỌNG]:
            - BỎ QUA LỊCH SỬ: Bạn hoạt động hoàn toàn độc lập trong mỗi lần phân tích. TUYỆT ĐỐI KHÔNG được nhớ, không được tham chiếu, và không được sử dụng lại bất kỳ dữ liệu, từ khóa, hay kỹ năng nào (như Java, React...) từ các yêu cầu ở phiên làm việc trước đó.
            - CHỈ DÙNG DỮ LIỆU HIỆN TẠI: Toàn bộ thông tin phân tích CHỈ được phép lấy đúng từ khối [DỮ LIỆU CV HIỆN TẠI] và [YÊU CẦU TỪ NGƯỜI DÙNG] được cung cấp ngay trong lần gọi này. Không được tự bịa dữ liệu.
            
            [QUY TẮC BÓC TÁCH VỊ TRÍ & CẤP BẬC (JOB_POSITION) - LÀM BƯỚC NÀY ĐẦU TIÊN]:
            - "job_position" là từ khóa chỉ chức danh công việc cụ thể.
            - BẮT BUỘC PHẢI GIỮ LẠI các tiền tố chỉ cấp bậc, kinh nghiệm hoặc hình thức làm việc (Ví dụ: "Thực tập sinh", "Intern", "Fresher", "Junior", "Senior", "Trưởng phòng", "Part-time").
            - CHUẨN HÓA TỪ VIẾT TẮT (AUTO-EXPAND): Nhận diện và dịch các từ viết tắt ngành IT.
              + Các biến thể có dấu gạch ngang: "f-e", "F/E" -> "Frontend", "b-e", "B/E" -> "Backend", "fs" -> "Fullstack".
              + Viết tắt cấp bậc: "TTS" -> "Thực tập sinh", "Jr" -> "Junior", "Sr" -> "Senior".
              + Viết tắt vị trí: "Dev" -> "Developer", "BA" -> "Business Analyst", "PM" -> "Project Manager", "QA" -> "Quality Assurance".
            
            [QUY TẮC XỬ LÝ THEO NGỮ CẢNH & XUNG ĐỘT KỸ NĂNG (TỐI QUAN TRỌNG)]:
            Hệ thống phải kiểm tra sự phù hợp giữa "job_position" (vừa bóc tách) và các "skills" trong [DỮ LIỆU CV HIỆN TẠI]:
            1. NẾU BỊ XUNG ĐỘT (CROSS-SKILL): Nếu "job_position" thuộc về một mảng chuyên môn KHÁC BIỆT so với các kỹ năng trong CV (VÍ DỤ CỤ THỂ: CV là Backend Java/Docker nhưng tìm việc Frontend, hoặc ngược lại).\s
               --> LỆNH BẮT BUỘC: VỨT BỎ TOÀN BỘ "skills" của CV. TUYỆT ĐỐI KHÔNG mang bất kỳ kỹ năng cũ nào (như Java, Docker) vào "search_query". Hãy để AI tự sinh ra các kỹ năng cốt lõi phù hợp với "job_position" mới.
            2. NẾU KHÔNG XUNG ĐỘT: Bắt buộc dùng "skills" từ CV để bù đắp.
            3. BÙ ĐẮP ĐỊA ĐIỂM/NGÀNH: Nếu [YÊU CẦU TỪ NGƯỜI DÙNG] thiếu "location" hoặc "category", luôn lấy từ CV để điền vào.
            
            [QUY TẮC CHUẨN HÓA ĐỊA ĐIỂM (CITY FORMATTING)]:
            - Chỉ lấy TÊN RIÊNG của địa danh. TUYỆT ĐỐI KHÔNG bao gồm các tiền tố như: "Thành phố", "TP", "Tỉnh", "Quận", "Thủ đô", "Huyện".
            - Tự động nhận diện và chuyển đổi các từ viết tắt: "HN" -> "Hà Nội", "HCM" -> "Hồ Chí Minh", "ĐN" -> "Đà Nẵng". Nếu mơ hồ -> null.
            
            [QUY TẮC BÓC TÁCH MỨC LƯƠNG]:
            - "salary_expect" chỉ nhận giá trị là SỐ TIỀN CỤ THỂ (VD: 15 triệu -> 15000000).
            - TUYỆT ĐỐI KHÔNG coi "lương tháng 13", "lương tháng 14" là mức lương. Đẩy chúng vào "search_query" và để salary_expect = null.
            
            [QUY TẮC TẠO SEARCH_QUERY (BƯỚC CHỐT HẠ)]:
            - "search_query" LÀ ĐỂ TẠO VECTOR NGỮ NGHĨA CHUYÊN MÔN.
            - NGUỒN TẠO DỮ LIỆU: BẮT BUỘC viết thành MỘT câu văn hoàn chỉnh kết hợp giữa:\s
               + Kỹ năng (Lấy từ CV nếu KHÔNG xung đột. Tự sinh ra kỹ năng mới nếu BỊ XUNG ĐỘT theo luật ở trên).
               + Phúc lợi (Lấy từ [YÊU CẦU TỪ NGƯỜI DÙNG], vd: "lương tháng 13").
            - TUYỆT ĐỐI KHÔNG chứa địa điểm, con số mức lương cụ thể, hoặc chức danh (đã tách ở job_position) trong chuỗi "search_query".\s
            
            [ĐỊNH DẠNG ĐẦU RA BẮT BUỘC (JSON)]:
            {
              "city": "Tên thành phố đã chuẩn hóa (VD: Đà Nẵng, Hà Nội). Không có thì null",
              "salary_expect": Mức lương tối thiểu dạng số nguyên (VD: 20000000). Không có thì null,
              "category_name": "Chọn 1 tên khớp nhất từ [DANH SÁCH CATEGORY HỆ THỐNG].",
              "job_position": "Chức danh công việc đã chuẩn hóa (VD: Thực tập sinh Frontend). Không có thì null",
              "search_query": "MỘT CÂU VĂN HOÀN CHỈNH mô tả kỹ năng công nghệ (tự sinh nếu trái ngành) và phúc lợi. Không dùng định dạng mảng."
            }
                --- DỮ LIỆU PHÂN TÍCH ĐÂY ---

""";
    private static final String TagJD_AI = """
NHIỆM VỤ: Trích xuất Tag TẬP TRUNG VÀO VỊ TRÍ VÀ QUYỀN LỢI từ JD_CONTENT dựa trên EXISTING_TAGS.

LUẬT CHỐNG NHIỄU & SUY DIỄN (STRICT RULES):
1. CẤM LẤY KỸ NĂNG VÀ NHIỆM VỤ: TUYỆT ĐỐI KHÔNG trích xuất các công việc hàng ngày, chuyên môn hay kỹ năng mềm (VD: Cấm lấy "Phát triển hệ thống", "API RESTful", "Tối ưu hiệu năng", "Làm việc nhóm").
2. CHỈ TẬP TRUNG VÀO 2 NHÓM DỮ LIỆU SAU:
   - [VỊ TRÍ]: Chức danh công việc chính (BẮT BUỘC có 1 tag).
   - [PHÚC LỢI]: Quyền lợi, đãi ngộ cụ thể (BẮT BUỘC trích xuất toàn bộ phúc lợi có trong văn bản. Tự động chuẩn hóa thành các cụm từ như: "Lương tháng 13", "Thường xuyên đi du lịch", "Làm việc remote", "Cấp MacBook").
3. TUYỆT ĐỐI BÁM SÁT NGỮ CẢNH: Chỉ lấy những đãi ngộ THỰC SỰ ĐƯỢC NHẮC ĐẾN trong văn bản. Không copy ví dụ trong prompt nếu JD không có.

QUY TẮC ĐỐI CHIẾU EXISTING_TAGS:
- Bước A: Nếu tag Vị trí/Phúc lợi vừa trích xuất khớp ý nghĩa với EXISTING_TAGS -> Dùng đúng tên tag của EXISTING_TAGS.
- Bước B: Nếu là đãi ngộ/vị trí hoàn toàn mới -> Đưa vào "new_tags".

RÀNG BUỘC SỐ LƯỢNG & BỔ SUNG:
- Cố gắng tìm đủ các tag phúc lợi.
- NẾU JD QUÁ NGẮN: CHỈ ĐƯỢC tự bổ sung các tag phúc lợi chung (như: "Chế độ bảo hiểm", "Môi trường năng động"). TUYỆT ĐỐI KHÔNG tự bổ sung thêm tag VỊ TRÍ.

ĐỊNH DẠNG JSON (TRẢ VỀ ĐÚNG 3 FIELD, KHÔNG LẶP LẠI KEY):
{
  "matched_tags": ["Tập hợp TẤT CẢ tag Vị trí và Phúc lợi thu thập được"],
  "has_new_tags": <chỉ điền 0 hoặc 1>,
  "new_tags": ["Chỉ chứa các tag KHÔNG CÓ trong EXISTING_TAGS"]
}

LUẬT CHỐT `has_new_tags`:
- Nếu new_tags rỗng [] -> has_new_tags: 0
- Nếu new_tags có dữ liệu -> has_new_tags: 1
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
    ///  Thêm thể cho bài ddnawg
    public String addTagJD(String dataJD, String listTag) {
        try {
            System.out.println("addTagJD: " + dataJD);
            System.out.println("listTagJD: " + listTag);
            OllamaOptions options = OllamaOptions.builder()
                    .temperature(0.0)
                    .top_k(10)
                    .top_p(0.1)
                    .num_predict(1500)
                    .num_ctx(8192)
                    .build();
            String finalPrompt = TagJD_AI +
                    "\n\n--- JD String ---\n" + dataJD + "\n\n--- Tag List ---\n" + listTag +
                    "\n\nResponse must be a valid JSON object.";
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