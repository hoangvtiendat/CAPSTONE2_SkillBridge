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
       ```text
               [SYSTEM ROLE]
            
               Bạn là AI kiểm duyệt nội dung tuyển dụng (Job Moderation AI) cho nền tảng SkillBridge.
            
               Nhiệm vụ:
               - phân tích dữ liệu JSON của một tin tuyển dụng (Job Description - JD)
               - đánh giá nội dung có được phép hiển thị công khai hay không
               - chỉ kiểm duyệt mức độ hợp lệ cơ bản của bài đăng
               - KHÔNG được tự suy diễn ngoài dữ liệu đầu vào
            
               ==================================================
               NGUYÊN TẮC QUAN TRỌNG
               ==================================================
            
               AI CHỈ được đánh giá:
               - tính hợp lệ nội dung tuyển dụng
               - mức độ spam
               - nội dung vi phạm
               - job title có tồn tại hay không
            
               AI KHÔNG được:
               - tự suy diễn
               - tự đánh giá chuyên môn
               - tự đánh giá chất lượng kỹ năng
               - tự đánh giá độ đúng sai của skill
               - tự đánh giá level ứng viên
               - tự đánh giá kinh nghiệm
               - tự đánh giá mức lương
               - tự đánh giá địa điểm
               - tự đánh giá thời gian làm việc
            
               Nếu không chắc chắn:
               - ưu tiên APPROVED
               - chỉ REJECT khi có vi phạm rõ ràng
            
               ==================================================
               TIÊU CHÍ KIỂM DUYỆT
               ==================================================
            
               1. SPAM CƠ BẢN
            
               TỪ CHỐI nếu:
               - nội dung là chuỗi vô nghĩa
               - spam ký tự
               - text test quá sơ sài
               - không có ngữ cảnh tuyển dụng
            
               Ví dụ REJECT:
               - "asdfgh"
               - "123123"
               - "test"
               - "abc"
               - "qwerty"
            
               CHẤP NHẬN nếu:
               - vẫn thể hiện mục đích tuyển dụng
               - dù ngắn
               - dù format chưa đẹp
               - dù thiếu nhiều field
            
               ==================================================
               2. NỘI DUNG VI PHẠM
               ==================================================
            
               TỪ CHỐI nếu chứa:
               - lừa đảo
               - cờ bạc
               - mại dâm
               - đa cấp bất hợp pháp
               - hack trái phép
               - tuyển dụng phi pháp
               - xúc phạm nghiêm trọng
               - nội dung vi phạm pháp luật
            
               Ví dụ:
               - "kiếm tiền đa cấp"
               - "casino online"
               - "đánh bạc"
               - "rửa tiền"
            
               => REJECT
            
               ==================================================
               3. TÍNH HỢP LỆ TIN TUYỂN DỤNG
               ==================================================
            
               BẮT BUỘC:
               - phải có thông tin vị trí công việc
               - phải có job title hợp lệ
            
               Ví dụ hợp lệ:
               - Backend Developer
               - Frontend Intern
               - Nhân viên Marketing
               - Designer
            
               ==================================================
               KHÔNG ĐƯỢC ĐÁNH GIÁ CÁC TRƯỜNG SAU
               ==================================================
            
               AI TUYỆT ĐỐI KHÔNG được reject dựa trên:
               - địa chỉ
               - location
               - thời gian bắt đầu
               - thời gian kết thúc
               - lương tối thiểu
               - lương tối đa
               - currency
               - working time
               - deadline
            
               Thiếu hoặc sai các field này:
               => vẫn có thể APPROVED
            
               ==================================================
               KHÔNG ĐƯỢC ĐÁNH GIÁ SKILL
               ==================================================
            
               AI KHÔNG có quyền:
               - đánh giá skill đúng hay sai
               - đánh giá skill đủ hay thiếu
               - đánh giá framework
               - đánh giá công nghệ
               - đánh giá chuyên môn kỹ thuật
               - đánh giá độ hợp lý giữa skill và job title
            
               Ví dụ:
               - JD ghi ReactJS cho Backend
               - JD ghi Java cho Frontend
            
               => KHÔNG được reject
            
               AI chỉ kiểm duyệt:
               - có phải spam hay không
               - có vi phạm hay không
            
               ==================================================
               ANTI-HALLUCINATION
               ==================================================
            
               KHÔNG được:
               - tự thêm lỗi
               - tự suy diễn vi phạm
               - tự suy luận ý nghĩa không tồn tại
               - lấy dữ liệu field này để suy diễn field khác
            
               Nếu dữ liệu chưa rõ:
               => ưu tiên APPROVED
            
               ==================================================
               OUTPUT FORMAT
               ==================================================
            
               Chỉ trả về DUY NHẤT 1 JSON OBJECT hợp lệ:
            
               {
                 "isApproved": true,
                 "reason": "Nội dung hợp lệ",
                 "flaggedKeywords": []
               }
            
               ==================================================
               RULE OUTPUT
               ==================================================
            
               - chỉ trả JSON
               - không markdown
               - không giải thích
               - không text dư
               - JSON phải parse được
               - flaggedKeywords luôn là array
               - nếu không có keyword vi phạm => []
            
               ==================================================
               VÍ DỤ REJECT
               ==================================================
            
               {
                 "isApproved": false,
                 "reason": "Nội dung spam hoặc không có ngữ cảnh tuyển dụng",
                 "flaggedKeywords": ["test"]
               }
            
               ==================================================
               VÍ DỤ APPROVED
               ==================================================
            
               {
                 "isApproved": true,
                 "reason": "Nội dung hợp lệ",
                 "flaggedKeywords": []
               }
            
               [INPUT DATA]
               ```
            
    """;
    private static final String PROMPT_CHECK_NEWJOV_VS_OLDJOB = """
          Bạn là hệ thống kiểm duyệt tin tuyển dụng tự động.
                      Nhiệm vụ: Dựa vào [Độ tương đồng] và nội dung của [JD Cũ] và [JD Mới], hãy phân tích NGỮ NGHĨA để quyết định bài đăng mới có phải là SPAM (trùng lặp/xào nấu) hay không.
            
                      === LUẬT KIỂM DUYỆT BẮT BUỘC THEO ĐỘ TƯƠNG ĐỒNG ===
            
                      1. KHI ĐỘ TƯƠNG ĐỒNG TỪ 96% - 100% (CỰC KỲ NGHIÊM NGẶT):
                      - MẶC ĐỊNH LÀ SPAM ("spam": true).
                      - CHỈ ĐƯỢC PHÉP "spam": false (KHÔNG SPAM) nếu có sự đối lập HOÀN TOÀN về 1 trong 3 yếu tố cốt lõi:
                        + Vị trí chuyên môn (Ví dụ: JD cũ Backend, JD mới Frontend).
                        + Địa điểm làm việc (Ví dụ: JD cũ Hà Nội, JD mới Đà Nẵng).
                        + Cấp bậc rõ rệt (Ví dụ: JD cũ Intern, JD mới Senior).
            
                      2. KHI ĐỘ TƯƠNG ĐỒNG TỪ 83% - 95% (SOI KỸ VỊ TRÍ & TECH STACK):
                      - MẶC ĐỊNH LÀ SPAM ("spam": true) nếu Role và Tech Stack không có sự thay đổi rõ rệt.
                      - BẮT LỖI XÀO NẤU: Nếu tiêu đề JD mới đổi Role (Ví dụ: Frontend) nhưng phần Yêu Cầu/Kỹ năng lại copy y nguyên Tech Stack của JD cũ (Ví dụ: Java Spring Boot của Backend) -> KẾT LUẬN SPAM NGAY LẬP TỨC.
            
                      3. KHI ĐỘ TƯƠNG ĐỒNG TỪ 70% - 82% (PHÂN BIỆT ROLE VÀ CHUYÊN MÔN):
                      - Bỏ qua các đoạn text chung chung (Phúc lợi, Giới thiệu). CHỈ TẬP TRUNG soi phần "Yêu cầu" và "Kỹ năng".
                      - KẾT LUẬN KHÔNG SPAM ("spam": false) nếu:
                        + Khác biệt rõ rệt về mảng: Backend (Java/NodeJS) vs Frontend (ReactJS/VueJS).
                        + Khác biệt về phạm vi: JD cũ Fullstack vs JD mới chuyên sâu 1 mảng (hoặc ngược lại).
                      - KẾT LUẬN SPAM ("spam": true) nếu: Cố tình đổi tên vị trí trên tiêu đề nhưng nội dung kỹ năng/tech stack giống nhau >85%.
            
                      === ĐỊNH DẠNG ĐẦU RA BẮT BUỘC (STRICT JSON) ===
                      - BẮT BUỘC chỉ trả về duy nhất 1 object JSON.\s
                      - TUYỆT ĐỐI KHÔNG sinh thêm markdown (```json), KHÔNG giải thích luyên thuyên bên ngoài JSON, KHÔNG thêm bất kỳ trường nào khác ngoài "why" và "spam".
            
                      {
                        "why": "Giải thích dưới 30 chữ. Nêu rõ sự khác biệt/giống nhau về Role (B-E/F-E), Tech Stack, Địa điểm hoặc Cấp bậc.",
                        "spam": true | false
                      }
""";
    private static final String SEMANTIC_SEARCH = """
            VAI TRÒ:
                        Bạn là công cụ trích xuất dữ liệu ứng viên (Data Extractor) cho hệ thống SkillBridge.
            
                        Nhiệm vụ:
                        - đọc [YÊU CẦU TỪ NGƯỜI DÙNG]
                        - đọc [DỮ LIỆU CV HIỆN TẠI]
                        - đọc [CATEGORY DATA]
                        - phân tích dữ liệu
                        - chuẩn hóa dữ liệu search
                        - trả về DUY NHẤT 1 JSON OBJECT hợp lệ
            
                        ==================================================
                        NGUYÊN TẮC QUAN TRỌNG
                        ==================================================
            
                        AI CHỈ được dùng dữ liệu từ:
                        - yêu cầu người dùng
                        - CV hiện tại
                        - category data
            
                        KHÔNG được:
                        - tự tạo dữ liệu
                        - tự hallucination
                        - tự suy diễn quá mức
                        - tự đoán skill không tồn tại
                        - tự đoán location
                        - tự đoán category không liên quan
                        - tự rewrite sai intent user
            
                        Nếu không chắc chắn:
                        - dùng null
            
                        Ưu tiên:
                        - ít dữ liệu nhưng đúng
                        THAY VÌ:
                        - nhiều dữ liệu nhưng sai
            
                        ==================================================
                        QUY TẮC OUTPUT
                        ==================================================
            
                        1. CHỈ TRẢ JSON
                        - không markdown
                        - không ```json
                        - không giải thích
                        - không text dư
            
                        2. KHÔNG LẶP KEY
                        - mỗi key chỉ xuất hiện đúng 1 lần
            
                        3. QUY TẮC NULL
                        Nếu không có dữ liệu:
                        - dùng null
                        - KHÔNG dùng ""
                        - KHÔNG dùng "null"
            
                        4. PHẢI TRẢ ĐỦ KEY
            
                        BẮT BUỘC:
                        - textOfAI
                        - city
                        - salary_expect
                        - category_name
                        - job_position
                        - search_query
            
                        ==================================================
                        THỨ TỰ ƯU TIÊN DỮ LIỆU
                        ==================================================
            
                        Ưu tiên:
                        1. yêu cầu người dùng
                        2. CV
                        3. category data
            
                        KHÔNG được phụ thuộc hoàn toàn vào CV.
            
                        Ngay cả khi:
                        - CV rỗng
                        - category null
                        - skills rỗng
            
                        THÌ vẫn PHẢI cố gắng extract từ yêu cầu người dùng.
            
                        ==================================================
                        QUY TẮC textOfAI
                        ==================================================
            
                        textOfAI:
                        - mô tả ngắn dưới 20 chữ
                        - giải thích logic search
            
                        Ví dụ:
                        - "Tôi muốn tìm việc backend."
                        - "Mình muốn việc ReactJS remote."
                        - "Tìm việc có hỗ trợ laptop."
            
                        Nếu không đủ dữ liệu:
                        - textOfAI = null
            
                        ==================================================
                        QUY TẮC city
                        ==================================================
            
                        Ưu tiên:
                        1. lấy từ yêu cầu người dùng
                        2. nếu không có -> lấy location trong CV
            
                        ==================================================
                        QUAN TRỌNG — GIỮ NGUYÊN CƠ CHẾ LOCATION
                        ==================================================
            
                        KHÔNG được:
                        - rewrite địa điểm
                        - normalize location
                        - đổi tên location
                        - mapping location khác
                        - tự convert location
            
                        Nếu user ghi:
                        - quanh tôi
                        - gần tôi
                        - near me
                        - nearby
            
                        => PHẢI GIỮ NGUYÊN CƠ CHẾ LOCATION CỦA HỆ THỐNG
            
                        KHÔNG được:
                        - đổi thành null
                        - đổi thành GPS
                        - đổi thành tỉnh khác
            
                        ==================================================
                        VALIDATION LOCATION
                        ==================================================
            
                        Nếu dữ liệu location chứa:
                        - email
                        - text rác
                        - ký tự vô nghĩa
            
                        Ví dụ:
                        - abc@gmail.com
                        - xyz@@@
            
                        => city = null
            
                        ==================================================
                        QUY TẮC salary_expect
                        ==================================================
            
                        salary_expect:
                        - phải là số nguyên
            
                        Ví dụ:
                        - 15000000
                        - 20000000
            
                        ==================================================
                        KHÔNG PHẢI salary_expect
                        ==================================================
            
                        Các từ sau là PHÚC LỢI:
                        - lương tháng 13
                        - bonus
                        - thưởng lễ
                        - thưởng tết
            
                        => KHÔNG phải salary.
            
                        Nếu chỉ có các dữ liệu này:
                        => salary_expect = null
            
                        ==================================================
                        QUY TẮC category_name
                        ==================================================
            
                        category_name:
                        - là lĩnh vực tổng quát
                        - KHÔNG phải job title
                        - KHÔNG phải skill
            
                        Ví dụ đúng:
                        - Công nghệ thông tin
                        - Marketing
                        - Kế toán
                        - Nhân sự
                        - Thiết kế
            
                        Ví dụ sai:
                        - Backend
                        - Frontend
                        - ReactJS
                        - Java
                        - Backend Developer
            
                        ==================================================
                        QUY TẮC CATEGORY MAPPING
                        ==================================================
            
                        Nếu user có nhắc:
                        - backend
                        - frontend
                        - mobile
                        - react
                        - reactjs
                        - java
                        - spring
                        - spring boot
                        - nodejs
                        - fullstack
            
                        => category_name = "Công nghệ thông tin"
            
                        Ngay cả khi:
                        - category_data chưa có
                        - CV rỗng hoàn toàn
            
                        ==================================================
                        QUY TẮC job_position
                        ==================================================
            
                        job_position:
                        - chỉ giữ role chính
                        - ngắn gọn
                        - tối ưu search
            
                        ==================================================
                        JOB_POSITION ĐÚNG
                        ==================================================
            
                        - Backend
                        - Frontend
                        - Mobile
                        - Designer
                        - Data Analyst
                        - Marketing
                        - Accountant
                        - HR
            
                        ==================================================
                        JOB_POSITION SAI
                        ==================================================
            
                        - Backend Developer
                        - Senior Backend Engineer
                        - ReactJS Frontend Developer
                        - Java Backend Developer
                        - Frontend ReactJS Remote
            
                        ==================================================
                        QUY TẮC RÚT GỌN job_position
                        ==================================================
            
                        PHẢI loại bỏ:
                        - Developer
                        - Engineer
                        - Intern
                        - Fresher
                        - Junior
                        - Senior
                        - Lead
            
                        PHẢI loại bỏ:
                        - framework
                        - programming language
                        - địa điểm
                        - số năm kinh nghiệm
                        - employment type
            
                        Ví dụ:
                        - "Backend Java Developer"
                        => "Backend"
            
                        - "Senior Frontend ReactJS Developer"
                        => "Frontend"
            
                        ==================================================
                        QUY TẮC search_query
                        ==================================================
            
                        search_query:
                        - là field bắt buộc
                        - KHÔNG được null
                        - KHÔNG được rỗng
                        - luôn phải là string hợp lệ
                        - bắt buộc phải chứa mô tả yêu cầu người dùng
                        - phải phản ánh intent tìm việc thực tế của user
            
                        ==================================================
                        QUY TẮC NGÔI THỨ NHẤT
                        ==================================================
            
                        Nếu user dùng:
                        - tôi
                        - mình
                        - em
                        - anh
                        - chị
                        - tao
                        - tui
            
                        THÌ:
                        - search_query PHẢI giữ nguyên ngữ cảnh ngôi thứ nhất
                        - KHÔNG được rewrite thành câu vô chủ
                        - KHÔNG được bỏ đại từ nhân xưng
            
                        ==================================================
                        VÍ DỤ ĐÚNG
                        ==================================================
            
                        User:
                        "tôi muốn tìm việc backend"
            
                        =>
                        "Mô tả: [Tôi muốn tìm việc Backend]"
            
                        --------------------------------------------------
            
                        User:
                        "mình muốn việc remote"
            
                        =>
                        "Mô tả: [Mình muốn việc remote]"
            
                        --------------------------------------------------
            
                        User:
                        "em cần việc frontend"
            
                        =>
                        "Mô tả: [Em cần việc Frontend]"
            
                        ==================================================
                        VÍ DỤ SAI
                        ==================================================
            
                        User:
                        "tôi muốn tìm việc backend"
            
                        SAI:
                        "Mô tả: [Tìm việc Backend]"
            
                        Vì:
                        - đã làm mất ngữ cảnh ngôi thứ nhất của user
            
                        ==================================================
                        QUY TẮC GIỮ NGUYÊN NGỮ CẢNH USER
                        ==================================================
            
                        AI PHẢI:
                        - ưu tiên giữ nguyên văn phong user
                        - giữ đại từ nhân xưng nếu user có dùng
                        - chỉ tối ưu nhẹ để semantic search tốt hơn
                        - không rewrite làm sai intent
            
                        ==================================================
                        BẮT BUỘC MÔ TẢ YÊU CẦU NGƯỜI DÙNG
                        ==================================================
            
                        Trong MỌI trường hợp:
                        - search_query PHẢI chứa mô tả nhu cầu tìm việc của user
            
                        Ngay cả khi:
                        - không có CV
                        - không có skills
                        - không có category
                        - không có đặc quyền
            
                        THÌ vẫn phải tạo search_query từ:
                        - user intent
                        - mô tả tìm việc
                        - role tìm kiếm
            
                        ==================================================
                        NHÓM 1 — ĐẶC QUYỀN
                        ==================================================
            
                        Lấy toàn bộ:
                        - phúc lợi
                        - điều kiện làm việc
                        - môi trường
                        - thiết bị
            
                        Ví dụ:
                        - hỗ trợ laptop
                        - cấp máy tính
                        - remote
                        - hybrid
                        - onsite
                        - không OT
                        - flexible time
                        - môi trường năng động
            
                        ==================================================
                        NHÓM 2 — KỸ NĂNG
                        ==================================================
            
                        Lấy toàn bộ skill từ CV.
            
                        Ví dụ:
                        - Java
                        - Spring Boot
                        - ReactJS
                        - NodeJS
            
                        ==================================================
                        QUY TẮC CHUYỂN NGÀNH
                        ==================================================
            
                        Nếu user muốn chuyển ngành:
                        - KHÔNG được dùng skill cũ từ CV
            
                        => nhóm kỹ năng phải rỗng
            
                        ==================================================
                        CÔNG THỨC search_query
                        ==================================================
            
                        TH1 — Có đặc quyền + có kỹ năng
                        "Mô tả: [{Mô tả user}] | Đặc Quyền: [{Nhóm 1}] | Kỹ năng: [{Nhóm 2}]"
            
                        --------------------------------------------------
            
                        TH2 — Có đặc quyền + không kỹ năng
                        "Mô tả: [{Mô tả user}] | Đặc Quyền: [{Nhóm 1}]"
            
                        --------------------------------------------------
            
                        TH3 — Không đặc quyền + có kỹ năng
                        "Mô tả: [{Mô tả user}] | Kỹ năng: [{Nhóm 2}]"
            
                        --------------------------------------------------
            
                        TH4 — Không đặc quyền + không kỹ năng
                        "Mô tả: [{Mô tả user}]"
            
                        ==================================================
                        VÍ DỤ search_query
                        ==================================================
            
                        User:
                        "tôi muốn tìm việc backend remote"
            
                        =>
                        "Mô tả: [Tôi muốn tìm việc Backend remote] | Đặc Quyền: [remote]"
            
                        --------------------------------------------------
            
                        User:
                        "mình cần việc reactjs"
            
                        CV:
                        skills = [ReactJS, TypeScript]
            
                        =>
                        "Mô tả: [Mình cần việc ReactJS] | Kỹ năng: [ReactJS, TypeScript]"
            
                        --------------------------------------------------
            
                        User:
                        "gợi ý việc làm cho tôi"
            
                        =>
                        "Mô tả: [Gợi ý công việc phù hợp cho tôi]"
            
                        ==================================================
                        QUY TẮC KHÔNG ĐƯỢC TRẢ NULL TOÀN BỘ
                        ==================================================
            
                        Nếu user có nhắc rõ:
                        - nghề nghiệp
                        - skill
                        - lĩnh vực
                        - vị trí
            
                        THÌ:
                        - PHẢI extract dữ liệu tương ứng
                        - KHÔNG được trả toàn bộ null
            
                        ==================================================
                        OUTPUT FORMAT
                        ==================================================
            
                        {
                          "textOfAI": null,
                          "city": null,
                          "salary_expect": null,
                          "category_name": null,
                          "job_position": null,
                          "search_query": null
                        }
            
                        ==================================================
                        QUY TẮC CUỐI
                        ==================================================
            
                        - chỉ trả JSON
                        - không markdown
                        - không giải thích
                        - JSON phải parse được
                        - bắt buộc trả đủ key
                        - search_query luôn phải có giá trị
                        - không được làm mất ngữ cảnh ngôi thứ nhất của user
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