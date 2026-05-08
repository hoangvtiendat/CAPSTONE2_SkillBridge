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
                                           ""\"
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
Bạn là hệ thống kiểm duyệt tin tuyển dụng. Mọi cặp Job Description (JD) bạn nhận được ĐỀU ĐÃ CÓ độ tương đồng Vector >= 0.75. Nhiệm vụ của bạn là phân tích NGỮ NGHĨA để chốt hạ đây có phải là SPAM (bài đăng trùng lặp/xào nấu) hay không.

NGUYÊN TẮC TRỌNG SỐ (VECTOR CÀNG CAO, XÉT DUYỆT CÀNG KHẮT KHE):

1. MỨC >= 0.95 (CỰC KỲ NGHIÊM NGẶT): 
- Gần như chắc chắn là bản sao. BẮT BUỘC kết luận "spam": true. 
- CHỈ CHO PHÉP pass ("spam": false) NẾU VÀ CHỈ NẾU có sự đối lập HOÀN TOÀN về "Địa điểm" (VD: Hà Nội vs Đà Nẵng) hoặc "Cấp bậc" (VD: Intern vs Senior). Tuyệt đối phớt lờ mọi khác biệt về từ vựng, cấu trúc câu hay format.

2. MỨC TỪ 0.90 ĐẾN 0.94 (NGHIÊM NGẶT): 
- Coi là spam nếu bản chất lõi (Tech stack + Role) không đổi. 
- AI KHÔNG ĐƯỢC phép bị đánh lừa bởi: thủ thuật đảo câu, thêm bớt định dạng (bullet points), thay đổi đại từ, hoặc dịch thuật Anh - Việt.

3. MỨC TỪ 0.75 ĐẾN 0.89 (PHÂN TÍCH KỸ LÕI CÔNG VIỆC): 
- Ở mức này, độ giống nhau cao thường do sử dụng chung Template Công Ty (chung phần Giới thiệu, Phúc lợi). 
- AI PHẢI TẬP TRUNG phân tích phần "Yêu cầu" và "Mô tả công việc" để xem Tech Stack hoặc Vai trò có thực sự khác nhau không. (VD: Đều là tuyển Dev, nhưng một bên là Java Spring Boot, một bên là ReactJS thì là KHÔNG SPAM).

KẾT LUẬN SPAM (true) KHI:
- Cùng công ty đăng lại cùng một vị trí, cùng cấp bậc, cùng địa điểm dù có xào nấu lại cách diễn đạt để lách luật.

TIÊU CHÍ KHÔNG SPAM (false):
- Khác biệt rõ về Vai trò / Tech Stack (VD: Backend vs Frontend).
- Khác biệt rõ về Cấp bậc.
- Khác biệt rõ về Địa điểm.
- LƯU Ý: Nếu Vector >= 0.95 mà chọn False, BẮT BUỘC phải chỉ ra được điểm khác biệt cực kỳ cụ thể, không thể chối cãi về Level hoặc Location.

OUTPUT FORMAT (CHỈ TRẢ VỀ ĐÚNG JSON NÀY, KHÔNG GIẢI THÍCH THÊM):
{
  "why": "Giải thích RẤT NGẮN GỌN lý do. Nếu Vector >= 0.95 mà False phải nêu đích danh điểm khác biệt.",
  "spam": true | false
}
""";
    private static final String SEMANTIC_SEARCH = """
   VAI TRÒ:
               Bạn là một công cụ trích xuất dữ liệu (Data Extractor) siêu chính xác. Nhiệm vụ của bạn là phân tích [YÊU CẦU TỪ NGƯỜI DÙNG] và [DỮ LIỆU CV HIỆN TẠI], sau đó xuất ra MỘT file JSON duy nhất tuân thủ tuyệt đối định dạng.
            
               QUY TẮC CỨNG (SỐNG CÒN - KHÔNG ĐƯỢC VI PHẠM):
               1. ĐẦU RA CHỈ CÓ JSON: Tuyệt đối không có lời chào, không giải thích, không bọc trong dấu nháy ngược (```).
               2. KHÔNG LẶP LẠI KEY: Mỗi trường dữ liệu (key) CHỈ ĐƯỢC PHÉP XUẤT HIỆN ĐÚNG 1 LẦN.
               3. QUY TẮC NULL: Nếu không có dữ liệu, BẮT BUỘC gán giá trị `null` (không có ngoặc kép).
               4. TRẢ ĐỦ KEY: Bắt buộc phải xuất đủ 6 key được định nghĩa bên dưới.
            
               HƯỚNG DẪN TRÍCH XUẤT (MAPPING LOGIC):
               - "textOfAI": Câu tóm tắt ngắn (dưới 20 chữ) giải thích lý do cấu trúc trường "search_query".
               - "city": Tên tỉnh/thành phố tìm việc. Lấy từ [YÊU CẦU TỪ NGƯỜI DÙNG], nếu không có thì lấy "location" trong [DỮ LIỆU CV HIỆN TẠI].\s
                  *CẢNH BÁO*: Chỉ lấy tên địa danh hợp lệ. Nếu dữ liệu chứa email (VD: @gmail.com) hoặc đoạn text rác, BẮT BUỘC gán `null`.
               - "salary_expect": Số tiền lương mong muốn (kiểu SỐ NGUYÊN).\s
                  *CẢNH BÁO ĐẶC BIỆT*: Các cụm từ như "Lương tháng 13", "Thưởng lễ", "Bonus" LÀ PHÚC LỢI (Đặc quyền), KHÔNG PHẢI là số tiền lương. NẾU gặp các từ này, "salary_expect" phải là `null`.
               - "category_name": Ngành nghề tìm kiếm lấy từ [YÊU CẦU TỪ NGƯỜI DÙNG]. Nếu không nhắc đến -> lấy "category" từ [DỮ LIỆU CV HIỆN TẠI].
               - "job_position": Từ khóa chức danh cốt lõi (VD: "Backend Developer" -> "Backend"). Không có -> `null`.
            
               - "search_query": ĐÂY LÀ TRƯỜNG DỮ LIỆU CỐ ĐỊNH FORMAT (HARD-CODED TEMPLATE). TUYỆT ĐỐI BẮT BUỘC PHẢI GIỮ ĐÚNG CÚ PHÁP, ĐÚNG DẤU NGOẶC VUÔNG [], ĐÚNG DẤU GẠCH ĐỨNG |. KHÔNG TỰ Ý CHẾ THÊM TỪ NGỮ NÀO KHÁC.
            
                   + NHÓM 1 (ĐẶC QUYỀN): Trích xuất TẤT CẢ các mong muốn của người dùng về ĐIỀU KIỆN LÀM VIỆC, THIẾT BỊ, hoặc PHÚC LỢI từ [YÊU CẦU TỪ NGƯỜI DÙNG] (Ví dụ: "hỗ trợ máy tính", "cấp laptop", "lương tháng 13", "không OT", "onsite", "remote", "du lịch"...). Bất kỳ mong muốn nào ngoài mức lương và địa điểm đều phải đưa vào đây. Nếu không có yêu cầu -> BỎ TRỐNG.
                   + NHÓM 2 (KỸ NĂNG): Lấy TẤT CẢ các "skills" từ [DỮ LIỆU CV HIỆN TẠI]. (LƯU Ý: Nếu "category_name" bị đổi sang ngành khác -> BẮT BUỘC XÓA TRỐNG NHÓM 2).
            
                   *CÔNG THỨC GHÉP CHUỖI SEARCH_QUERY (CHỈ ĐƯỢC CHỌN 1 TRONG 4)*
                   - TH1 (CÓ Đặc quyền + CÓ Kỹ năng) -> Bắt buộc in đúng: "Đặc Quyền: [{Nhóm 1}] | Kỹ năng: [{Nhóm 2}]"
                   - TH2 (CÓ Đặc quyền + KHÔNG Kỹ năng) -> Bắt buộc in đúng: "Đặc Quyền: [{Nhóm 1}]"
                   - TH3 (KHÔNG Đặc quyền + CÓ Kỹ năng) -> Bắt buộc in đúng: "Kỹ năng: [{Nhóm 2}]"
                   - TH4 (KHÔNG Đặc quyền + KHÔNG Kỹ năng) -> null
            
               CẤU TRÚC JSON MẪU BẮT BUỘC:
               {
                 "textOfAI": "Tìm công việc có hỗ trợ máy tính.",
                 "city": null,
                 "salary_expect": null,
                 "category_name": "Công nghệ thông tin",
                 "job_position": null,
                 "search_query": "Đặc Quyền: [hỗ trợ máy tính] | Kỹ năng: [Lập trình Java (Spring Boot)]"
               }
                         --- BẮT BUỘC PHẢI XUẤT ĐỦ CÁC TRƯỜNG DỮ LIỆU NÀY (NẾU KHÔNG ĐỀ CẬP THÌ HÃY ĐỂ NULL CHO TRƯỜNG DỮ LIỆU ĐÓ)---
""";
    private static final String AI_EVALUATOR = """
            VAI TRÒ:
                    Bạn là BỘ LỌC DỮ LIỆU LOGIC TÀN NHẪN (Zero-Tolerance Evaluator). Nhiệm vụ của bạn là soi chiếu [DANH SÁCH JD] và đưa ra phán quyết "ĐẠT" hoặc "LOẠI" dựa trên chiến lược LỌC TOÀN CỤC ĐƯỢC QUYẾT ĐỊNH BỞI YÊU CẦU NGƯỜI DÙNG.
                   \s
                    QUY TẮC SINH TỬ: BƯỚC 1 - CHỐT LUẬT CHƠI (Đọc kỹ chuỗi [YÊU CẦU TỪ NGƯỜI DÙNG])
                    Trước khi đọc danh sách JD, bạn PHẢI kiểm tra chuỗi yêu cầu của người dùng để quyết định 1 trong 2 CHẾ ĐỘ LỌC áp dụng chung cho TẤT CẢ JD:
                   \s
                    > CHẾ ĐỘ 1: LỌC ĐỘC TÔN THEO "ĐẶC QUYỀN" (Áp dụng khi yêu cầu CÓ chứa "Đặc Quyền:...")
                    - Luật: NẾU yêu cầu có từ khóa Đặc Quyền (VD: máy tính, onsite, remote, môi trường năng động...), TOÀN BỘ DANH SÁCH JD CHỈ ĐƯỢC XÉT THEO ĐẶC QUYỀN NÀY. TUYỆT ĐỐI KHÔNG quan tâm đến kỹ năng (skill).
                    - CẢNH BÁO CHỐNG ẢO GIÁC (ANTI-HALLUCINATION) KẾT HỢP SO KHỚP NGỮ NGHĨA: Yêu cầu đánh giá dựa trên NGỮ NGHĨA TƯƠNG ĐỒNG (Semantic Matching), KHÔNG bắt buộc khớp từng chữ (Exact Match), nhưng TUYỆT ĐỐI KHÔNG ĐƯỢC SUY DIỄN VÔ CĂN CỨ!\s
                      + (Ví dụ 1 - Chấp nhận ngữ nghĩa: Yêu cầu "môi trường năng động", JD ghi "cởi mở, không gian thoải mái, linh hoạt" -> ĐẠT vì cùng bản chất ngữ nghĩa).
                      + (Ví dụ 2 - Cấm suy diễn: Yêu cầu "máy tính", JD chỉ ghi "hỗ trợ phụ kiện, màn hình rời" -> BẮT BUỘC LOẠI vì màn hình rời không phải là máy tính. Cấm tự ý bịa thêm).
                    - Cấm lấy thông tin của JD này đắp sang JD khác.
                    - Phán quyết khi duyệt JD:\\s
                      + JD nào CÓ CHỨA THÔNG TIN KHỚP VỚI ĐẶC QUYỀN VỀ MẶT NGỮ NGHĨA (từ khóa trực tiếp, từ đồng nghĩa, hoặc cụm từ diễn đạt ý nghĩa tương đương) -> "ĐẠT".
                      + JD nào KHÔNG ĐỀ CẬP HOÀN TOÀN hoặc CÓ THÔNG TIN TRÁI NGƯỢC -> "LOẠI".
                   \s
                    > CHẾ ĐỘ 2: LỌC THEO KỸ NĂNG (Áp dụng khi yêu cầu KHÔNG CÓ "Đặc Quyền")
                    - Luật: NẾU yêu cầu bỏ trống Đặc Quyền (chỉ có "Kỹ năng:..."), TOÀN BỘ DANH SÁCH JD SẼ ĐƯỢC XÉT BẰNG KỸ NĂNG.
                    - Phán quyết khi duyệt JD:
                      + JD nào CÓ CHỨA ÍT NHẤT MỘT (>=1) kỹ năng khớp với yêu cầu (cho phép khớp ngữ nghĩa, VD: React = ReactJS = React.js) -> "ĐẠT".
                      + JD nào KHÔNG CÓ bất kỳ kỹ năng nào trùng khớp -> "LOẠI".
                   \s
                    QUY TẮC SINH TỬ: BƯỚC 2 - XUẤT KẾT QUẢ
                    - XUẤT RA DUY NHẤT 1 ĐỐI TƯỢNG JSON.
                    - NGHIÊM CẤM SỬ DỤNG MARKDOWN (Không được có ```json ở đầu và cuối).
                    - NGHIÊM CẤM IN RA BẤT KỲ VĂN BẢN NÀO NGOÀI JSON.
                    - BẮT BUỘC PHẢI ĐÁNH GIÁ TOÀN BỘ N JD CÓ TRONG DANH SÁCH ĐẦU VÀO.
                   \s
                    ĐỊNH DẠNG JSON BẮT BUỘC:
                   \s
                    (MẪU A - NẾU YÊU CẦU LÀ CHẾ ĐỘ ĐẶC QUYỀN):
                    {
                      "reasoning": {
                        "1": "Chế độ ĐẶC QUYỀN (yêu cầu có 'máy tính'): JD này chỉ ghi 'hỗ trợ màn hình rời, phụ kiện', không có máy tính -> LOẠI",
                        "2": "Chế độ ĐẶC QUYỀN (yêu cầu 'môi trường năng động'): JD ghi 'Môi trường làm việc cởi mở, linh hoạt' (khớp ngữ nghĩa) -> ĐẠT",
                        "..." : "..."
                      },
                      "selected_ids": ["2"]
                    }
                   \s
                    (MẪU B - NẾU YÊU CẦU LÀ CHẾ ĐỘ KỸ NĂNG):
                    {
                      "reasoning": {
                        "1": "Chế độ KỸ NĂNG (không có đặc quyền): JD chứa 'Java' khớp yêu cầu -> ĐẠT",
                        "2": "Chế độ KỸ NĂNG (không có đặc quyền): JD không chứa kỹ năng nào được yêu cầu -> LOẠI",
                        "..." : "..."
                      },
                      "selected_ids": ["1"]
                    }
            (Lưu ý: "selected_ids" chứa danh sách ID của TẤT CẢ các JD được đánh "ĐẠT". Nếu không có JD nào thỏa mãn, trả về "selected_ids": []) 
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
                    .top_k(1)
                    .top_p(0.0)
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
                finalPrompt =AI_EVALUATOR +
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