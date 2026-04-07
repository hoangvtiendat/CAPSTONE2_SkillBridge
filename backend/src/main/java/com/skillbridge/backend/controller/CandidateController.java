package com.skillbridge.backend.controller;

import com.skillbridge.backend.config.CustomUserDetails;
import com.skillbridge.backend.dto.request.JobApplicationRequest;
import com.skillbridge.backend.dto.request.UpdateCandidateCvRequest;
import com.skillbridge.backend.dto.response.ApiResponse;
import com.skillbridge.backend.dto.response.UpdateCandidateCvResponse;
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
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
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
    public ResponseEntity<ApiResponse<UpdateCandidateCvRequest>> parseCv(
            @RequestParam("file") MultipartFile file
    ) {
        UpdateCandidateCvRequest response = candidateService.parsingCV(file);
        ApiResponse<UpdateCandidateCvRequest> apiResponse = new ApiResponse<>();
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
            @RequestParam String query,
            String CategoryId) {
        Pageable pageable = PageableUtils.createPageable(0, 10, "name", "asc");
        List<Skill> suggestions = skillService.getAutocompleteSkills(query, CategoryId, pageable);
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
            @RequestPart("cv") MultipartFile cv
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
}
