package com.skillbridge.backend.service;

import com.skillbridge.backend.config.CustomUserDetails;
import com.skillbridge.backend.dto.request.CVJobEvaluationRequest;
import com.skillbridge.backend.dto.response.CVJobEvaluationResponse;
import com.skillbridge.backend.entity.CVJobEvaluation;
import com.skillbridge.backend.entity.Candidate;
import com.skillbridge.backend.entity.Job;
import com.skillbridge.backend.entity.User;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.repository.CVJobEvaluationRepository;
import com.skillbridge.backend.repository.CandidateRepository;
import com.skillbridge.backend.repository.JobRepository;
import com.skillbridge.backend.repository.UserRepository;
import com.skillbridge.backend.utils.SecurityUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CVJobEvaluationService {

    SecurityUtils securityUtils;
    UserRepository userRepository;
    CandidateRepository candidateRepository;
    JobRepository jobRepository;
    GeminiService geminiService;
    CVJobEvaluationRepository cvJobEvaluationRepository;

    private CVJobEvaluationResponse mapToResponse(CVJobEvaluation eval, Candidate candidate, Job job) {
        CVJobEvaluationResponse response = new CVJobEvaluationResponse();
        response.setCandidateId(candidate.getId());
        response.setCandidateName(candidate.getName());
        response.setJobId(job.getId());
        response.setTitleJob(job.getDescription());
        response.setMatchScore(eval.getMatchScore());
        response.setStrengths(eval.getStrengths());
        response.setWeaknesses(eval.getWeaknesses());
        response.setRoadmap(eval.getRoadmap());
        return response;
    }

    public CVJobEvaluationResponse candidate_self_Evaluation(String jobId,CVJobEvaluationRequest request){
        System.out.println("request: " + request);
        CustomUserDetails currentUser = securityUtils.getCurrentUser();
        User user = userRepository.findById(currentUser.getUserId()).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        Candidate candidate = candidateRepository.findById(user.getId()).orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND));
        return createCVJobEvaluation(jobId, request, candidate);
    }

    public CVJobEvaluationResponse createCVJobEvaluation(String jobId, CVJobEvaluationRequest request,Candidate candidate) {
        CustomUserDetails currentUser = securityUtils.getCurrentUser();
        User user = userRepository.findById(currentUser.getUserId()).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new AppException(ErrorCode.JOB_NOT_FOUND));

        //Kiểm tra xem đã tạo trước đó hay chưa
//        var existingEval = cvJobEvaluationRepository.findByJobAndCandidateAndCreateByUserId(job, candidate, user.getRole());
//        if (existingEval.isPresent()) {
//            return mapToResponse(existingEval.get(), candidate, job);
//        }

        String candidateInformation = candidate.getParsedContentJson();
        String jobInformation = jobRepository.getJobAsJson(jobId);

        // 2. Build prompt
        String prompt = """
                Bạn là một chuyên gia tuyển dụng kỹ thuật cấp cao và cố vấn nghề nghiệp.
                
                Nhiệm vụ của bạn là đánh giá mức độ phù hợp của một ứng viên với một công việc một cách CHI TIẾT, CHUYÊN NGHIỆP và CÓ TÍNH THỰC TIỄN.
                
                ========================
                QUY TẮC NGHIÊM NGẶT (BẮT BUỘC PHẢI TUÂN THỦ):
                - Toàn bộ nội dung văn bản được tạo ra trong các trường JSON PHẢI bằng TIẾNG VIỆT.
                - CHỈ sử dụng khoảng trắng (space) tiêu chuẩn để thụt lề.
                - KHÔNG sử dụng ngắt dòng thực tế (Enter) bên trong giá trị chuỗi JSON; hãy sử dụng '\\\\n' nếu bắt buộc phải ngắt dòng.
                - Đảm bảo tất cả dấu ngoặc kép bên trong chuỗi giá trị được escape (thoát) thành \\\\".
                - CHỈ trả về JSON hợp lệ.
                - KHÔNG bao gồm ```json hoặc ``` hoặc bất kỳ lời giải thích nào.
                - KHÔNG thêm bất kỳ văn bản nào nằm ngoài JSON.
                - TẤT CẢ các trường đều BẮT BUỘC có mặt.
                - matchScore phải là một số từ 0 đến 100.
                - strengths (điểm mạnh) và weaknesses (điểm yếu) PHẢI chi tiết (ít nhất 3-5 câu cho mỗi phần).
                - KHÔNG viết các câu trả lời ngắn gọn hoặc chung chung.
                - Phản hồi PHẢI là JSON hợp lệ và có thể parse được bằng Jackson.
                - KHÔNG bao gồm dấu phẩy ở phần tử cuối cùng (trailing commas).
                - KHÔNG bao gồm các chú thích (comments).
                - KHÔNG bao gồm ngắt dòng bên trong các trường JSON nếu không thực sự cần thiết.
                ========================
                
                ĐỊNH DẠNG ĐẦU RA (JSON KEY PHẢI GIỮ NGUYÊN TIẾNG ANH):
                {
                  "candidateId": "string",
                  "candidateName": "string",
                  "jobId": "string",
                  "titleJob": "string",
                  "matchScore": number,
                  "strengths": "string",
                  "weaknesses": "string",
                  "roadmap": [
                    {
                      "title": "string",
                      "description": "string",
                      "priority": "HIGH | MEDIUM | LOW",
                      "duration": "string",
                      "relatedWeakness": "string"
                    }
                  ]
                }
                
                ========================
                HƯỚNG DẪN ĐÁNH GIÁ:
                
                1. matchScore (Điểm phù hợp):
                - 0–40: Kém phù hợp
                - 41–60: Trung bình
                - 61–80: Tốt
                - 81–100: Rất phù hợp
                
                2. strengths (Điểm mạnh - Viết bằng Tiếng Việt):
                - Nêu rõ các kỹ năng, dự án, công nghệ cụ thể mà ứng viên có.
                - Giải thích TẠI SAO những yếu tố đó lại phù hợp với công việc này.
                - Phải cụ thể, không nói chung chung.
                
                3. weaknesses (Điểm yếu - Viết bằng Tiếng Việt):
                - Chỉ ra các kỹ năng hoặc kinh nghiệm còn thiếu.
                - Làm nổi bật khoảng cách giữa ứng viên và yêu cầu công việc.
                - Mỗi điểm yếu cần được xác định rõ ràng thành các ý riêng biệt.
                
                ========================
                QUY TẮC LỘ TRÌNH (QUAN TRỌNG):
                
                - Số lượng các bước trong roadmap (lộ trình) PHẢI phụ thuộc vào điểm yếu của ứng viên.
                - Đối với mỗi điểm yếu chính, hãy tạo ít nhất MỘT bước tương ứng trong lộ trình.
                - Nếu một điểm yếu quá phức tạp, hãy chia nó thành nhiều bước.
                - Lộ trình thường bao gồm từ 3 đến 10 bước (hoặc hơn nếu cần thiết).
                - Mỗi bước PHẢI trực tiếp giải quyết một điểm yếu cụ thể.
                
                YÊU CẦU NGHIÊM NGẶT:
                - MỌI điểm yếu ĐỀU PHẢI được giải quyết trong lộ trình.
                - Mỗi bước trong lộ trình PHẢI bao gồm:
                  - title: tiêu đề ngắn gọn và rõ ràng (bằng Tiếng Việt).
                  - description: ít nhất 2-3 câu, chi tiết và có thể thực hiện được (bằng Tiếng Việt).
                  - priority: CHỈ SỬ DỤNG "HIGH", "MEDIUM", HOẶC "LOW".
                  - duration: ước lượng thời gian thực tế, ví dụ: "2 tuần", "1 tháng" (bằng Tiếng Việt).
                  - relatedWeakness: phải ghi rõ nó đang giải quyết điểm yếu nào (bằng Tiếng Việt).
                
                QUY TẮC ƯU TIÊN (priority):
                - HIGH = then chốt và bắt buộc để phù hợp với công việc.
                - MEDIUM = quan trọng nhưng không khẩn cấp.
                - LOW = cải thiện tùy chọn.
                
                QUY TẮC CHẤT LƯỢNG:
                - Lộ trình PHẢI mang tính cá nhân hóa cao cho ĐÚNG ứng viên này và ĐÚNG công việc này.
                - KHÔNG tạo ra các bước chung chung.
                - KHÔNG lặp lại các bước tương tự nhau.
                - Tập trung vào các cải thiện thực tế, có thể áp dụng ngay trong công việc.
                
                ========================
                NHIỆM VỤ:
                
                Đánh giá mức độ tương thích giữa ứng viên và công việc dựa trên các quy tắc ở trên. 
                Mọi văn bản tạo ra (giá trị của string) phải sử dụng ngôn ngữ TIẾNG VIỆT, mạch lạc và chuyên nghiệp.
                
                Nếu thông tin bị thiếu, hãy đưa ra các giả định hợp lý nhưng vẫn phải trả về đầy đủ JSON.
                
                ========================
                ĐẦU VÀO:
                
                candidateId: %s
                jobId: %s
                
                Ứng viên (Candidate):
                %s
                
                Công việc (Job):
                %s
                
                KIỂM TRA HỢP LỆ (VALIDATION):
                Trước khi trả về, hãy đảm bảo:
                - JSON hoàn toàn hợp lệ (Strict valid).
                - Tất cả các key đều sử dụng dấu ngoặc kép.
                - Không có dấu phẩy thừa ở cuối (No trailing commas).
                - Toàn bộ text giải thích được sinh ra là Tiếng Việt.
                - Cấu trúc có thể được parse trực tiếp bằng Jackson ObjectMapper.
                ========================
                
                Bây giờ hãy tạo phản hồi JSON.
                """.formatted(candidate.getId(), jobId, request, jobInformation);

        System.out.println("prompt: " + prompt);

        CVJobEvaluationResponse response = geminiService.callGemini(
                prompt,
                CVJobEvaluationResponse.class
        );

        // 4. Fix dữ liệu chắc chắn đúng (tránh AI sai)
        response.setCandidateId(candidate.getId());
        response.setJobId(jobId);
        response.setCandidateName(candidate.getName());
        response.setTitleJob(job.getDescription());

        // 5. Validate matchScore (optional nhưng nên có)
        if (response.getMatchScore() == null ||
                response.getMatchScore() < 0 ||
                response.getMatchScore() > 100) {
            response.setMatchScore(0.0);
        }

        CVJobEvaluation evaluation = CVJobEvaluation.builder()
                .candidate(candidate)
                .job(job)
                .matchScore(response.getMatchScore())
                .strengths(response.getStrengths())
                .weaknesses(response.getWeaknesses())
                .roadmap(response.getRoadmap())
                .createByUserId(user.getRole())
                .build();

        cvJobEvaluationRepository.save(evaluation);

        return response;
    }

    public CVJobEvaluationResponse getCVJobEvaluation(String jobId) {
        CustomUserDetails currentUser = securityUtils.getCurrentUser();
        User user = userRepository.findById(currentUser.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        Candidate candidate = candidateRepository.findById(user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND));

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new AppException(ErrorCode.JOB_NOT_FOUND));
         
        CVJobEvaluation eval = cvJobEvaluationRepository.findByJobAndCandidateAndCreateByUserId(job, candidate, user.getRole())
                .orElseThrow(() -> new AppException(ErrorCode.EVALUATION_NOT_FOUND));

        CVJobEvaluationResponse response = new CVJobEvaluationResponse();
        response.setCandidateId(candidate.getId());
        response.setCandidateName(candidate.getName());
        response.setJobId(jobId);
        response.setTitleJob(job.getDescription());
        response.setMatchScore(eval.getMatchScore());
        response.setStrengths(eval.getStrengths());
        response.setWeaknesses(eval.getWeaknesses());
        response.setRoadmap(eval.getRoadmap());

        return response;
    }
}
