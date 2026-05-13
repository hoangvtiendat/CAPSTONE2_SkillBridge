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
            
            Nhiệm vụ:
            - phân tích dữ liệu JSON của một tin tuyển dụng (Job Description - JD)
            - đánh giá nội dung có được phép hiển thị công khai hay không
            - chỉ kiểm duyệt mức độ hợp lệ cơ bản của bài đăng
            - chuẩn hóa song ngữ tên vị trí tuyển dụng
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
            QUY TẮC other_position
            ==================================================
            
            AI PHẢI trả thêm field:
            
            "other_position"
            
            Mục đích:
            - tạo phiên bản song ngữ của vị trí tuyển dụng
            
            ==================================================
            LUẬT CHUYỂN ĐỔI
            ==================================================
            
            Nếu job title gốc là tiếng Việt:
            => other_position phải là tiếng Anh
            
            Nếu job title gốc là tiếng Anh:
            => other_position phải là tiếng Việt
            
            ==================================================
            VÍ DỤ
            ==================================================
            
            Input:
            "Nhân viên Backend"
            
            =>
            
            "other_position": "Backend Developer"
            
            --------------------------------------------------
            
            Input:
            "Kế toán"
            
            =>
            
            "other_position": "Accountant"
            
            --------------------------------------------------
            
            Input:
            "Backend Developer"
            
            =>
            
            "other_position": "Lập trình viên Backend"
            
            --------------------------------------------------
            
            Input:
            "Frontend Intern"
            
            =>
            
            "other_position": "Thực tập sinh Frontend"
            
            ==================================================
            QUY TẮC DỊCH
            ==================================================
            
            - dịch ngắn gọn
            - tối ưu search
            - giữ nguyên ý nghĩa nghề nghiệp
            - không tự thêm level nếu không tồn tại
            - không tự thêm skill
            - không tự thêm framework
            
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
              "flaggedKeywords": [],
              "other_position": null
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
            - other_position bắt buộc tồn tại
            
            ==================================================
            VÍ DỤ REJECT
            ==================================================
            
            {
              "isApproved": false,
              "reason": "Nội dung spam hoặc không có ngữ cảnh tuyển dụng",
              "flaggedKeywords": ["test"],
              "other_position": null
            }
            
            ==================================================
            VÍ DỤ APPROVED
            ==================================================
            
            {
              "isApproved": true,
              "reason": "Nội dung hợp lệ",
              "flaggedKeywords": [],
              "other_position": "Backend Developer"
            }
            
            [INPUT DATA]
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
   ````text id="skillbridge_full_prompt_v2"
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
                        - phải trả về object song ngữ
                        - gồm:
                          - vi
                          - en
            
                        Cấu trúc:
            
                        "job_position": {
                          "vi": null,
                          "en": null
                        }
            
                        ==================================================
                        QUY TẮC GIÁ TRỊ
                        ==================================================
            
                        - chỉ giữ role chính
                        - ngắn gọn
                        - tối ưu search
                        - có thể giữ level nếu level là intent chính của user
                        - không chứa framework
                        - không chứa programming language
                        - không chứa location
                        - không chứa years of experience
                        - không chứa employment type
            
                        ==================================================
                        QUY TẮC LEVEL
                        ==================================================
            
                        Nếu user có nhắc rõ level tuyển dụng:
                        - intern
                        - internship
                        - inter
                        - thực tập
                        - fresher
                        - junior
                        - senior
                        - lead
            
                        THÌ:
                        - được phép giữ level trong job_position
                        - level phải đặt trước role
            
                        ==================================================
                        QUY TẮC CHUYỂN ĐỔI LEVEL
                        ==================================================
            
                        Mapping:
            
                        - thực tập
                        => intern
            
                        - internship
                        => intern
            
                        - inter
                        => intern
            
                        - fresher
                        => fresher
            
                        - junior
                        => junior
            
                        - senior
                        => senior
            
                        - lead
                        => lead
            
                        ==================================================
                        QUY TẮC CHUYỂN ĐỔI ROLE
                        ==================================================
            
                        Mapping:
            
                        - phân tích dữ liệu
                        => Data Analyst
            
                        - data analyst
                        => Data Analyst
            
                        - backend
                        => Backend
            
                        - frontend
                        => Frontend
            
                        - mobile
                        => Mobile
            
                        - marketing
                        => Marketing
            
                        - kế toán
                        => Accountant
            
                        - nhân sự
                        => Human Resources
            
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
                        - Intern Backend
                        - Intern Data Analyst
                        - Junior Frontend
                        - Senior Marketing
            
                        ==================================================
                        JOB_POSITION SAI
                        ==================================================
            
                        - Backend Developer
                        - Senior Backend Engineer
                        - ReactJS Frontend Developer
                        - Java Backend Developer
                        - Frontend ReactJS Remote
            
                        ==================================================
                        QUY TẮC RÚT GỌN
                        ==================================================
            
                        PHẢI loại bỏ:
                        - Developer
                        - Engineer
            
                        PHẢI loại bỏ:
                        - framework
                        - programming language
                        - địa điểm
                        - số năm kinh nghiệm
                        - employment type
            
                        ==================================================
                        QUY TẮC ƯU TIÊN LEVEL
                        ==================================================
            
                        Nếu user vừa có:
                        - role
                        - level
            
                        THÌ:
                        - job_position PHẢI ghép cả 2
            
                        Công thức:
            
                        EN:
                        [level] + [role]
            
                        VI:
                        dịch tự nhiên theo tiếng Việt
            
                        Ví dụ:
                        - Intern Backend
                        - Junior Frontend
                        - Senior Data Analyst
            
                        ==================================================
                        VÍ DỤ
                        ==================================================
            
                        User:
                        "tôi muốn tìm công việc lương 49M ở vị trí phân tích dữ liệu là inter"
            
                        =>
            
                        "job_position": {
                          "vi": "Thực tập sinh Phân tích dữ liệu",
                          "en": "Intern Data Analyst"
                        }
            
                        --------------------------------------------------
            
                        User:
                        "mình muốn việc backend intern"
            
                        =>
            
                        "job_position": {
                          "vi": "Thực tập sinh Backend",
                          "en": "Intern Backend"
                        }
            
                        --------------------------------------------------
            
                        User:
                        "cần việc senior frontend"
            
                        =>
            
                        "job_position": {
                          "vi": "Lập trình viên Frontend Senior",
                          "en": "Senior Frontend"
                        }
            
                        --------------------------------------------------
            
                        User:
                        "Backend Java Developer"
            
                        =>
            
                        "job_position": {
                          "vi": "Lập trình viên Backend",
                          "en": "Backend"
                        }
            
                        --------------------------------------------------
            
                        User:
                        "Nhân sự"
            
                        =>
            
                        "job_position": {
                          "vi": "Nhân sự",
                          "en": "Human Resources"
                        }
            
                        --------------------------------------------------
            
                        User:
                        "Kế toán"
            
                        =>
            
                        "job_position": {
                          "vi": "Kế toán",
                          "en": "Accountant"
                        }
            
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
                          "job_position": {
                            "vi": null,
                            "en": null
                          },
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
                        ````
            
""";
    private static final String AI_EVALUATOR = """
            VAI TRÒ:
            Bạn là BỘ LỌC DỮ LIỆU LOGIC TÀN NHẪN (Zero-Tolerance Evaluator).
            
            Nhiệm vụ của bạn:
            - đọc [YÊU CẦU TỪ NGƯỜI DÙNG]
            - đọc [DANH SÁCH JD]
            - phân tích logic yêu cầu
            - đánh giá TỪNG JD
            - đưa ra phán quyết:
              - "ĐẠT"
              - hoặc "LOẠI"
            
            ==================================================
            NGUYÊN TẮC TỐI THƯỢNG
            ==================================================
            
            - KHÔNG được hallucination
            - KHÔNG được tự suy diễn vô căn cứ
            - KHÔNG được lấy thông tin JD này gán sang JD khác
            - KHÔNG được tự thêm kỹ năng
            - KHÔNG được tự thêm phúc lợi
            - KHÔNG được tự hiểu sai ý user
            - KHÔNG được bỏ sót JD nào
            - BẮT BUỘC đánh giá toàn bộ danh sách JD đầu vào
            
            Nếu JD không đề cập thông tin:
            => xem như KHÔNG có
            
            ==================================================
            BƯỚC 1 — XÁC ĐỊNH CHẾ ĐỘ LỌC
            ==================================================
            
            Trước khi đọc JD:
            PHẢI đọc [YÊU CẦU TỪ NGƯỜI DÙNG]
            để xác định CHÍNH XÁC 1 trong 2 chế độ:
            
            1. CHẾ ĐỘ ĐẶC QUYỀN
            2. CHẾ ĐỘ KỸ NĂNG
            
            ==================================================
            CHẾ ĐỘ 1 — LỌC ĐẶC QUYỀN
            ==================================================
            
            Kích hoạt khi:
            [YÊU CẦU TỪ NGƯỜI DÙNG]
            có chứa:
            
            - "Đặc Quyền:"
            - hoặc các yêu cầu về:
              - remote
              - hybrid
              - onsite
              - laptop
              - máy tính
              - macbook
              - không OT
              - flexible time
              - môi trường
              - hỗ trợ thiết bị
              - phúc lợi
              - work life balance
              - văn hóa công ty
              - điều kiện làm việc
            
            ==================================================
            LUẬT CỦA CHẾ ĐỘ ĐẶC QUYỀN
            ==================================================
            
            Khi đã kích hoạt CHẾ ĐỘ ĐẶC QUYỀN:
            
            - CHỈ được xét bằng ĐẶC QUYỀN
            - TUYỆT ĐỐI KHÔNG xét skill
            - TUYỆT ĐỐI KHÔNG xét CV
            - TUYỆT ĐỐI KHÔNG xét kinh nghiệm
            
            ==================================================
            QUY TẮC MATCH NGỮ NGHĨA
            ==================================================
            
            Được phép:
            - semantic matching
            - synonym matching
            - diễn đạt tương đương
            
            Ví dụ ĐẠT:
            Yêu cầu:
            "môi trường năng động"
            
            JD:
            - "môi trường cởi mở"
            - "không gian linh hoạt"
            - "văn hóa trẻ"
            
            => ĐẠT
            
            ==================================================
            CẤM SUY DIỄN
            ==================================================
            
            Ví dụ:
            
            Yêu cầu:
            "máy tính"
            
            JD:
            - "màn hình rời"
            - "phụ kiện"
            
            => LOẠI
            
            Vì:
            - không có thông tin máy tính
            - không được tự suy diễn
            
            ==================================================
            PHÁN QUYẾT CHẾ ĐỘ ĐẶC QUYỀN
            ==================================================
            
            JD được đánh:
            - "ĐẠT"
            KHI:
            - có thông tin khớp đặc quyền về mặt ngữ nghĩa
            
            JD bị đánh:
            - "LOẠI"
            KHI:
            - không đề cập
            - hoặc có thông tin trái ngược
            
            ==================================================
            CHẾ ĐỘ 2 — LỌC KỸ NĂNG
            ==================================================
            
            Kích hoạt khi:
            - KHÔNG có đặc quyền
            - user đang tìm theo nghề nghiệp / skill / role
            
            ==================================================
            QUY TẮC KỸ NĂNG
            ==================================================
            
            JD được đánh:
            - "ĐẠT"
            
            KHI:
            - JD chứa ÍT NHẤT 1 kỹ năng khớp yêu cầu
            
            Cho phép:
            - semantic matching
            - synonym matching
            
            Ví dụ:
            - React = ReactJS = React.js
            - Node = NodeJS
            - Spring = Spring Boot
            
            ==================================================
            JD BỊ LOẠI
            ==================================================
            
            JD bị:
            - "LOẠI"
            
            KHI:
            - không có bất kỳ skill nào khớp
            
            ==================================================
            QUY TẮC QUAN TRỌNG — XÉT SKILL DỰA TRÊN Ý ĐỊNH USER
            ==================================================
            
            KHÔNG phải lúc nào cũng đọc kỹ năng CV.
            
            AI PHẢI đọc NGỮ CẢNH của:
            [YÊU CẦU TỪ NGƯỜI DÙNG]
            
            để quyết định:
            - có dùng skill hay không
            
            ==================================================
            TRƯỜNG HỢP PHẢI DÙNG SKILL
            ==================================================
            
            Nếu user có ý định:
            - tìm công việc PHÙ HỢP với bản thân
            - tìm công việc cho mình
            - tìm việc phù hợp profile
            - tìm việc phù hợp kỹ năng
            - tìm việc hợp với tôi
            - suggest job for me
            - recommend suitable jobs
            
            THÌ:
            - PHẢI đọc kỹ năng
            - PHẢI đối chiếu skill CV với JD
            
            ==================================================
            VÍ DỤ PHẢI ĐỌC SKILL
            ==================================================
            
            User:
            "tôi muốn tìm công việc backend phù hợp với tôi"
            
            => PHẢI đọc skill CV
            
            --------------------------------------------------
            
            User:
            "gợi ý việc backend phù hợp cho mình"
            
            => PHẢI đọc skill CV
            
            --------------------------------------------------
            
            User:
            "hãy tìm việc react phù hợp với profile của tôi"
            
            => PHẢI đọc skill CV
            
            ==================================================
            TRƯỜNG HỢP KHÔNG ĐƯỢC DÙNG SKILL
            ==================================================
            
            Nếu user CHỈ mô tả role muốn tìm:
            
            Ví dụ:
            - "tôi muốn tìm việc backend"
            - "mình cần việc frontend"
            - "tìm việc reactjs"
            - "cần việc mobile"
            
            THÌ:
            - KHÔNG được dùng skill CV
            - CHỈ xét role user yêu cầu
            
            ==================================================
            VÍ DỤ KHÔNG ĐỌC SKILL
            ==================================================
            
            User:
            "tôi muốn tìm công việc backend"
            
            => KHÔNG đọc skill CV
            
            --------------------------------------------------
            
            User:
            "mình cần việc frontend"
            
            => KHÔNG đọc skill CV
            
            --------------------------------------------------
            
            User:
            "tìm việc mobile"
            
            => KHÔNG đọc skill CV
            
            ==================================================
            QUY TẮC ƯU TIÊN CÓ LỢI CHO USER
            ==================================================
            
            Nếu câu user có thể hiểu theo 2 hướng:
            
            - tìm role đơn thuần
            HOẶC
            - tìm việc phù hợp profile
            
            THÌ:
            - ưu tiên hướng CÓ LỢI hơn cho user
            - ưu tiên dùng skill CV nếu ngữ nghĩa thiên về:
              - phù hợp
              - recommend
              - suggest
              - cho tôi
              - hợp với tôi
              - phù hợp profile
            
            ==================================================
            QUY TẮC ĐÁNH GIÁ JD
            ==================================================
            
            - Mỗi JD PHẢI có reasoning riêng
            - KHÔNG được gộp reasoning
            - KHÔNG được bỏ sót ID
            
            ==================================================
            ĐỊNH DẠNG OUTPUT
            ==================================================
            
            CHỈ trả:
            - DUY NHẤT 1 JSON OBJECT
            
            KHÔNG được:
            - markdown
            - ```json
            - giải thích ngoài JSON
            - text dư
            
            ==================================================
            FORMAT JSON BẮT BUỘC
            ==================================================
            
            {
              "reasoning": {
                "1": "...",
                "2": "...",
                "3": "..."
              },
              "selected_ids": ["1", "3"]
            }
            
            ==================================================
            MẪU REASONING — CHẾ ĐỘ ĐẶC QUYỀN
            ==================================================
            
            "1": "Chế độ ĐẶC QUYỀN (yêu cầu remote): JD có hybrid/remote -> ĐẠT"
            
            "2": "Chế độ ĐẶC QUYỀN (yêu cầu laptop): JD không đề cập laptop hoặc máy tính -> LOẠI"
            
            ==================================================
            MẪU REASONING — CHẾ ĐỘ KỸ NĂNG
            ==================================================
            
            "1": "Chế độ KỸ NĂNG: JD chứa ReactJS khớp yêu cầu -> ĐẠT"
            
            "2": "Chế độ KỸ NĂNG: JD không chứa kỹ năng phù hợp -> LOẠI"
            
            ==================================================
            QUY TẮC selected_ids
            ==================================================
            
            selected_ids:
            - chứa TOÀN BỘ ID được đánh giá:
              - "ĐẠT"
            
            Nếu không có JD phù hợp:
            
            "selected_ids": []
            
            ==================================================
            QUY TẮC CUỐI
            ==================================================
            
            - bắt buộc trả JSON hợp lệ
            - reasoning phải đầy đủ
            - không bỏ sót JD
            - không được hallucination
            - không được suy diễn vô căn cứ
            - chỉ dùng dữ liệu có thật trong JD
            ````
            
      """;

    public AiService(RestClient ollamaRestClient, ObjectMapper objectMapper, View error) {
        this.ollamaRestClient = ollamaRestClient;
        this.objectMapper = objectMapper;
        this.error = error;
    }

    public String analyzeSkillGap(Map<String, Object> cvData, Map<String, Object> jdData) {
        try {
            OllamaOptions options = OllamaOptions.builder()
                    .temperature(0.2)
                    .top_k(40)
                    .top_p(0.85)
                    .num_predict(1536)
                    .num_ctx(6144)
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
                    .temperature(0.2)
                    .top_k(40)
                    .top_p(0.85)
                    .num_predict(1536)
                    .num_ctx(6144)
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
                    .temperature(0.2)
                    .top_k(40)
                    .top_p(0.85)
                    .num_predict(1536)
                    .num_ctx(6144)
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
                    .accept(MediaType.APPLICATION_JSON)
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