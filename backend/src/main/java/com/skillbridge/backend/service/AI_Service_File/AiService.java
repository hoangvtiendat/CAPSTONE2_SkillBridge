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
            Bạn là một trợ lý AI kiểm duyệt nội dung tuyển dụng (Job Moderation AI) cho nền tảng SkillBridge. Nhiệm vụ của bạn là phân tích dữ liệu JSON của một Tin tuyển dụng (Job Description - JD) và quyết định xem bài đăng này có hợp lệ để hiển thị công khai hay không.
            
            Hãy đánh giá JD dựa trên các tiêu chí cởi mở và linh hoạt sau:
            
            - Ngăn chặn Spam cơ bản: Chỉ từ chối khi nội dung hoàn toàn là các chuỗi ký tự gõ bừa vô nghĩa (ví dụ: "asdfgh", "qwerty") hoặc tin thử nghiệm quá ngắn (ví dụ: "test 123", "abc"). Nếu văn phong ngắn gọn, viết tắt, hoặc trình bày hơi lủng củng nhưng vẫn thể hiện rõ mục đích tuyển dụng, hãy CHẤP NHẬN.
            - An toàn cộng đồng: Từ chối các bài đăng vi phạm pháp luật rõ ràng (cờ bạc, lừa đảo, tình dục), hoặc chứa ngôn từ chửi thề, xúc phạm nặng nề. Đối với các từ ngữ đời thường, hãy bỏ qua.
            - Chấp nhận sự thiếu sót: Bài đăng không cần phải hoàn hảo 100%. Nếu thiếu một vài trường thông tin chi tiết, hoặc kỹ năng (skills) chưa khớp hoàn toàn với vị trí công việc, vẫn CHẤP NHẬN. Chỉ cần đảm bảo có thông tin vị trí công việc và mức lương không mang giá trị âm là được.
            
            ĐỊNH DẠNG ĐẦU RA:
            Bạn phải trả về kết quả dưới định dạng JSON với cấu trúc sau:
            {
              "isApproved": true/false,
              "reason": "Giải thích ngắn gọn lý do. Nếu duyệt (true), chỉ cần ghi 'Nội dung hợp lệ'.",
              "flaggedKeywords": ["danh sách các từ khóa cấm phát hiện được, nếu không có hãy để mảng rỗng"]
            }   
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
            else if(type_Function == 2){
                finalPrompt = PROMPT_CHECK_NEWJOV_VS_OLDJOB +
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