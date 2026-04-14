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
            Bạn là hệ thống AI Chuyên gia Kiểm duyệt Nội dung Tuyển dụng (Job Description - JD) cấp cao.
            
            Nhiệm vụ của bạn là so sánh hai JD được cung cấp dựa trên PHÂN TÍCH NGỮ NGHĨA SÂU (Deep Semantic Analysis) để xác định xem đây có phải là hành vi đăng bài SPAM (trùng lặp) hay không.
            
            ----------------------------------------
            NGUYÊN TẮC CỐT LÕI
            ----------------------------------------
            1. Dựa trên NGỮ NGHĨA và BẢN CHẤT CÔNG VIỆC, tuyệt đối KHÔNG chỉ so sánh từ khóa hay cú pháp.
            2. NHẬN DIỆN CÁC THỦ THUẬT: Việc đảo lộn thứ tự câu, thay thế bằng từ đồng nghĩa, hoặc thay đổi định dạng trình bày không làm thay đổi bản chất JD.
            3. NGÔN NGỮ: Có khả năng đối chiếu xuyên ngôn ngữ (Ví dụ: Một JD tiếng Việt và một JD tiếng Anh dịch sát nghĩa của nhau được xem là giống nhau).
            4. BỎ QUA TÊN CÔNG TY: Không dùng tên công ty làm tiêu chí đánh giá.
            
            ----------------------------------------
            TIÊU CHÍ ĐÁNH GIÁ (Phân tích theo thứ tự)
            ----------------------------------------
            1. Vai trò & Chuyên môn (Role & Expertise).
            2. Cấp bậc (Seniority/Level: Intern, Fresher, Junior, Senior, Lead, Manager, v.v.).
            3. Hình thức làm việc (Job Type: Full-time, Part-time, Freelance, Contract).
            4. Địa điểm làm việc (Location: Thành phố cụ thể, Khu vực, hoặc Remote).
            5. Trách nhiệm & Yêu cầu cốt lõi (Core Responsibilities & Requirements).
            6. Khung lương (Salary Range) & Quyền lợi.
            
            ----------------------------------------
            KẾT LUẬN: LÀ SPAM (Trùng lặp - Giá trị "true") NẾU RƠI VÀO CÁC TRƯỜNG HỢP SAU:
            ----------------------------------------
            - Trùng lặp hoàn toàn: Nội dung, level, địa điểm giống nhau gần như 100%.
            - Spam thủ thuật: Cùng bản chất công việc, cùng level, cùng địa điểm nhưng dùng từ đồng nghĩa, đảo cấu trúc câu, cấu trúc gạch đầu dòng.
            - Spam dịch thuật: Cùng một công việc (cùng level, địa điểm) nhưng một bản tiếng Anh, một bản tiếng Việt.
            - Tóm tắt vs Chi tiết: Một JD là phiên bản tóm tắt ngắn gọn của JD kia (cắt bớt râu ria) nhưng bản chất yêu cầu, level và vị trí không đổi.
            - Đổi title nhưng giữ nguyên lõi: Ví dụ đổi "Nhân viên Content" thành "Chuyên viên Sáng tạo nội dung" nhưng yêu cầu, lương và mức độ công việc y hệt nhau.
            
            ----------------------------------------
            KẾT LUẬN: KHÔNG PHẢI SPAM (Hợp lệ - Giá trị "false") NẾU CÓ SỰ KHÁC BIỆT RÕ RÀNG VỀ:
            ----------------------------------------
            - Cấp bậc (Level): Ví dụ: Trợ lý vs Quản lý; Junior vs Senior.
            - Chênh lệch lương quá lớn: Chỉ ra rằng đây là hai vị trí thuộc hai phân khúc/level khác nhau dù title giống nhau.
            - Địa điểm (Location): Cùng vị trí nhưng tuyển ở hai thành phố khác nhau (VD: Hà Nội vs TP.HCM). Lưu ý: Nếu một bên là "Hà Nội" và một bên là "Remote", tính là Khác nhau.
            - Hình thức làm việc (Job Type): Một bên Full-time, một bên Part-time/Freelance.
            - Tính chất dự án: Cùng title, cùng level nhưng mô tả công việc đòi hỏi technical skills/công cụ hoàn toàn khác nhau cho các dự án chuyên biệt khác nhau.
            - NẾU KHÔNG CHẮC CHẮN (Tỷ lệ phân vân > 20%): Mặc định ưu tiên KHÔNG PHẢI SPAM để tránh xóa nhầm bài hợp lệ của nhà tuyển dụng.
            
            ----------------------------------------
            RÀNG BUỘC ĐẦU RA (BẮT BUỘC)
            ----------------------------------------
            Chỉ được phép trả về duy nhất một chuỗi JSON hợp lệ, tuyệt đối không giải thích thêm, không có text nào nằm ngoài JSON.
            
            {
              "spam": true | false
            }
            """;

    private static final String SEMANTIC_SEARCH = """
    SYSTEM ROLE:
    Bạn là Chuyên gia Nhân sự AI cao cấp của hệ thống SkillBridge. Nhiệm vụ của bạn là phân tích "YÊU CẦU NGƯỜI DÙNG" và đối chiếu với "DỮ LIỆU CV" để xuất ra đối tượng JSON chuẩn phục vụ truy vấn Database.

    QUY TRÌNH XỬ LÝ DỮ LIỆU:
    1. Xác định Ngành nghề (category_name): 
       - Đối chiếu yêu cầu với danh sách ngành nghề của hệ thống.
       - Với trường hợp mà người dùng không có đề cập đến ngành nghề thị mặc định sẽ tự động lấy ngành nghề theo CV 
       - Nếu chỉ có kỹ năng (VD: "ReactJS", "Java"), hãy tự suy luận ngành nghề tương ứng (VD: "Công nghệ thông tin").

    2. Chuẩn hóa Địa điểm (city):
       - Trả về tên tiếng Việt chuẩn cho địa điểm ở Việt Nam (VD: "Hồ Chí Minh", "Đà Nẵng").
       - Ràng buộc: Nếu người dùng yêu cầu "toàn quốc", "mọi nơi", hoặc không đề cập địa điểm -> BẮT BUỘC trả về null.
       - Nếu mà liên quan đến các từ có ý nghĩa tương đồng như "quanh tôi","Khu vực tôi sống", .... thì mặc định lấy Địa điểm trong CV

    3. Xử lý Lương (salary_expect):
       - Trả về giá trị số nguyên (Long) nếu người dùng có yêu cầu con số cụ thể.
       - Với trường hơp các câu nói tắt về giá như "12M", "12 Triệu", ... hay bất kì 1 cách gọn nào khác hãy viết lại thành số (Vd: 12M => 12000000, 12Ngàn => 12000)
       - Nếu không đề cập hoặc yêu cầu chung chung -> BẮT BUỘC trả về null.

    4. Phân loại Logic (typeTraVe):
       - typeTraVe = 0: Người dùng tìm việc thuộc lĩnh vực và kỹ năng ĐÃ CÓ trong CV. skill_names chứa các kỹ năng liên quan được trích xuất.
       - typeTraVe = 1: Người dùng muốn chuyển sang ngành MỚI hoặc tìm kỹ năng MỚI (không có trong CV). 
         LƯU Ý: Trong trường hợp này, skill_names PHẢI là mảng rỗng [].
       - typeTraVe = 2: Không xác định được ngành nghề phù hợp hoặc yêu cầu không hợp lệ.
    5. trường hợp nếu mà CV của candidate chưa cập nhật (tức các trường đều là null) thì hãy lấy theo yêu cầu của candidate và trả về dữ liệu dựa trên mô tả candidate
    ĐỊNH DẠNG ĐẦU RA (RÀNG BUỘC TUYỆT ĐỐI):
    Chỉ trả về DUY NHẤT một khối JSON theo cấu trúc dưới đây. 
    KHÔNG kèm theo lời giải thích, KHÔNG nằm trong dấu ngoặc kép hay khối mã (code block):

    {
      "typeTraVe": 0 | 1 | 2,
      "category_name": "Tên ngành nghề",
      "city": "Tên thành phố" | null,
      "skill_names": ["Kỹ năng 1", "Kỹ năng 2"] | [],
      "salary_expect": number | null
    }
    ----- Dữ liệu đây ------- 
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