package com.skillbridge.backend.controller;

import com.skillbridge.backend.config.CustomUserDetails;
import com.skillbridge.backend.dto.request.UpdateCandidateCvRequest;
import com.skillbridge.backend.dto.response.*;
import com.skillbridge.backend.entity.Category;
import com.skillbridge.backend.entity.Skill;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.service.CandidateService;
import com.skillbridge.backend.service.CategoryProfessionService;
import com.skillbridge.backend.service.SkillService;
import com.skillbridge.backend.utils.PageableUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/candidates")
public class CandidateController {
    CandidateService candidateService;
    CategoryProfessionService categoryProfessionService;
    SkillService skillService;

    /**
     * Upload và phân tích CV bằng AI/OCR
     */
    @PostMapping("/parse-cv")
    public ResponseEntity<ApiResponse<LLMResumeResponse>> parseCv(
            @RequestParam("file") MultipartFile file
    ) {
        LLMResumeResponse response = candidateService.parsingCV(file);
        ApiResponse<LLMResumeResponse> apiResponse = new ApiResponse<>();
        apiResponse.setResult(response);
        apiResponse.setMessage("CV đã được tải lên và phân tích thành công");
        return ResponseEntity.ok(apiResponse);
    }

    /**
     * Lấy thông tin CV hiện tại của ứng viên
     */
    @GetMapping("/cv")
    public ResponseEntity<ApiResponse<UpdateCandidateCvResponse>> getCv(
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        UpdateCandidateCvResponse result = candidateService.getCv(user.getUserId());
        System.out.println("result: " + result);
        ApiResponse<UpdateCandidateCvResponse> response = new ApiResponse<>();
        response.setResult(result);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/auto-skill")
    public ResponseEntity<ApiResponse<List<Skill>>> autoSkill(
            @RequestParam("query") String query,
            @RequestParam(value = "categoryId", required = false) String categoryId) {
        Pageable pageable = PageableUtils.createPageable(0, 10, "name", "asc");
        List<Skill> suggestions = skillService.getAutocompleteSkills(query, categoryId, pageable);
        return ResponseEntity.ok(ApiResponse.<List<Skill>>builder()
                .code(HttpStatus.OK.value())
                .message("Gợi ý kỹ năng cho từ khóa: " + query)
                .result(suggestions)
                .build());
    }

    @GetMapping("/auto-category")
    public ResponseEntity<ApiResponse<List<Category>>> autoCategory(@RequestParam String query) {
        Pageable pageable = PageableUtils.createPageable(0, 10, "name", "asc");
        List<Category> suggestions = categoryProfessionService.getAutocompleteCategory(query, pageable);
        return ResponseEntity.ok(ApiResponse.<List<Category>>builder()
                .code(HttpStatus.OK.value())
                .message("Gợi ý ngành nghề cho từ khóa: " + query)
                .result(suggestions)
                .build());
    }

    /**
     * Cập nhật thông tin CV (sau khi ứng viên đã chỉnh sửa từ kết quả Parse)
     */
    @PutMapping("/cv")
    public ResponseEntity<ApiResponse<UpdateCandidateCvResponse>> updateCv(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestPart("data") UpdateCandidateCvRequest request,
            @RequestPart(value = "cv", required = false) MultipartFile cv
    ) {
        try {
            UpdateCandidateCvResponse result = candidateService.updateCv(user.getUserId(), request, cv);
            ApiResponse<UpdateCandidateCvResponse> response = new ApiResponse<>();
            response.setResult(result);
            return ResponseEntity.ok(response);
        } catch (AppException ex) {
            ex.printStackTrace();
            throw ex;
        } catch (Exception ex) {
            ex.printStackTrace();
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    @PatchMapping("/open-to-work")
    public ResponseEntity<ApiResponse<UpdateCandidateCvResponse>> toggleOpenToWork(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestParam boolean isOpenToWork) {

        UpdateCandidateCvResponse response = candidateService.updateOpenToWork(user.getUserId(),isOpenToWork);

        return ResponseEntity.ok(ApiResponse.<UpdateCandidateCvResponse>builder()
                .result(response)
                .message("Cập nhật trạng thái tìm việc thành công")
                .build());
    }
    /**
     * 2. Nhà tuyển dụng săn nhân tài - tìm 10 ứng viên match nhất (chưa apply)
     * URL: GET /candidates/potential/{jobId}
     */
    @GetMapping("/potential/{jobId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> findPotentialCandidates(
            @PathVariable String jobId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "limit", defaultValue = "15") int limit
    ) {
        Map<String, Object> result = candidateService.findPotentialCandidates(jobId, page, limit);

        List<?> candidates = (List<?>) result.get("candidates");

        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder()
                .code(HttpStatus.OK.value())
                .message("Tìm thấy " + result.get("totalElements") + " nhân tài phù hợp")
                .result(result)
                .build());
    }
    /**
     * 3. Nhà tuyển dụng thực hiện đánh giá một ứng viên cụ thể
     * URL: GET /candidates/evaluate-by-recruiter/{candidateId}/{jobId}
     */
    @GetMapping("/evaluate-by-recruiter/{candidateId}/{jobId}")
    public ResponseEntity<ApiResponse<CVJobEvaluationResponse>> evaluateByRecruiter(
            @PathVariable String candidateId,
            @PathVariable String jobId
    ) {
        CVJobEvaluationResponse result = candidateService.getOrInitiateRecruiterEvaluation(candidateId, jobId);
        return ResponseEntity.ok(ApiResponse.<CVJobEvaluationResponse>builder()
            .code(HttpStatus.OK.value())
            .message("Nhà tuyển dụng đánh giá ứng viên thành công")
            .result(result)
            .build());
    }


    /// check Khách hàng đã cập nhật CV hay chưa
    @GetMapping("/cv/check")
    public Boolean checkCV(){
        return candidateService.checkCV();
    }

    @GetMapping("/my-invitations")
    public ResponseEntity<ApiResponse<List<JobInvitationResponse>>> getMyInvitations(

    ) {
        List<JobInvitationResponse> result = candidateService.getCandidateInvitations();
        return ResponseEntity.ok(ApiResponse.<List<JobInvitationResponse>>builder()
            .code(HttpStatus.OK.value())
            .message("Tìm được " + result.size() + "lời mời")
            .result(result)
            .build());
    }
}
