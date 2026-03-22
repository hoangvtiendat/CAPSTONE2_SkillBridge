package com.skillbridge.backend.controller;

import com.skillbridge.backend.config.CustomUserDetails;
import com.skillbridge.backend.dto.request.UpdateCandidateCvRequest;
import com.skillbridge.backend.dto.response.ApiResponse;
import com.skillbridge.backend.dto.response.UpdateCandidateCvResponse;
import com.skillbridge.backend.entity.Skill;
import com.skillbridge.backend.service.CandidateService;
import com.skillbridge.backend.service.SkillService;
import com.skillbridge.backend.utils.PageableUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.data.domain.Pageable;
import java.util.List;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/candidates")
public class CandidateController {
    CandidateService candidateService;
    SkillService skillService;
    /**
     * Upload và phân tích CV bằng AI/OCR
     */
    @PostMapping("/parse-cv")
    public ResponseEntity<ApiResponse<UpdateCandidateCvRequest>> parseCv(
            @AuthenticationPrincipal CustomUserDetails user,
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
        ApiResponse<UpdateCandidateCvResponse> response = new ApiResponse<>();
        response.setResult(result);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/autocomplete")
    public ResponseEntity<ApiResponse<List<Skill>>> autocompleteSkill(@RequestParam String query) {
        Pageable pageable = PageableUtils.createPageable(0, 10, "name", "asc");
        List<Skill> suggestions = skillService.getAutocompleteSkills(query, pageable);
        return ResponseEntity.ok(ApiResponse.<List<Skill>>builder()
                .code(HttpStatus.OK.value())
                .message("Gợi ý kỹ năng cho từ khóa: " + query)
                .result(suggestions)
                .build());
    }

    /**
     * Cập nhật thông tin CV (sau khi ứng viên đã chỉnh sửa từ kết quả Parse)
     */
    @PutMapping("/cv")
    public ResponseEntity<ApiResponse<UpdateCandidateCvResponse>> updateCv(
        @AuthenticationPrincipal CustomUserDetails user,
        @RequestBody UpdateCandidateCvRequest request
    ) {
        UpdateCandidateCvResponse result = candidateService.updateCv(user.getUserId(), request);
        ApiResponse<UpdateCandidateCvResponse> response = new ApiResponse<>();
        response.setResult(result);
        return ResponseEntity.ok(response);
    }
}
