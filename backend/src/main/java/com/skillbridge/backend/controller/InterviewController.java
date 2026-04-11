package com.skillbridge.backend.controller;

import com.skillbridge.backend.dto.request.BatchSlotRequest;
import com.skillbridge.backend.dto.request.SlotRequest;
import com.skillbridge.backend.dto.response.ApiResponse;
import com.skillbridge.backend.dto.response.CandidateResponse;
import com.skillbridge.backend.dto.response.InterviewResponse;
import com.skillbridge.backend.dto.response.InterviewSlotResponse;
import com.skillbridge.backend.service.InterviewService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/interviews")
public class InterviewController {

    InterviewService interviewService;
    /**
     * Lấy danh sách tất cả slot của một công việc cụ thể.
     */
    @GetMapping("/jobs/{jobId}/slots")
    public ResponseEntity<ApiResponse<List<InterviewSlotResponse>>> getSlots(
            @PathVariable String jobId,
            @RequestParam(defaultValue = "false") boolean availableOnly) {

        List<InterviewSlotResponse> result;
        if (availableOnly) {
            result = interviewService.getAvailableSlotsByJob(jobId);
        } else {
            result = interviewService.getAllSlotsByJob(jobId);
        }

        return ResponseEntity.ok(ApiResponse.<List<InterviewSlotResponse>>builder()
            .result(result)
            .message("Lấy danh sách khung giờ thành công.")
            .build());
    }

    /**
     * API dành cho Nhà tuyển dụng tạo hàng loạt Slot trống.
     */
    @PostMapping("/batch-slots")
    public ResponseEntity<ApiResponse<List<InterviewSlotResponse>>> createSlots(@RequestBody BatchSlotRequest request) {
        List<InterviewSlotResponse> result = interviewService.createBatchSlots(request);
        ApiResponse<List<InterviewSlotResponse>> response = ApiResponse.<List<InterviewSlotResponse>>builder()
                .result(result)
                .message("Tạo danh sách khung giờ phỏng vấn thành công.")
                .build();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/slots/{slotId}")
    public ResponseEntity<ApiResponse<InterviewSlotResponse>> updateSlot(
            @PathVariable String slotId,
            @RequestBody SlotRequest request) {

        InterviewSlotResponse result = interviewService.updateSlot(slotId, request);
        return ResponseEntity.ok(ApiResponse.<InterviewSlotResponse>builder()
                .result(result)
                .message("Cập nhật khung giờ thành công.")
                .build());
    }

    /**
     * API dành cho Nhà tuyển dụng khóa hoặc mở khóa một khung giờ phỏng vấn.
     */
    @PatchMapping("/slots/{slotId}/lock")
    public ResponseEntity<ApiResponse<InterviewSlotResponse>> toggleLockSlot(
            @PathVariable String slotId,
            @RequestParam boolean lock) {

        InterviewSlotResponse result = interviewService.toggleLockSlot(slotId, lock);
        String message = lock ? "Đã khóa khung giờ phỏng vấn." : "Đã mở khóa khung giờ phỏng vấn.";

        return ResponseEntity.ok(ApiResponse.<InterviewSlotResponse>builder()
                .result(result)
                .message(message)
                .build());
    }

    /**
     * API dành cho Nhà tuyển dụng xoá một khung giờ phỏng vấn.
     */
    @DeleteMapping("/slots/{slotId}")
    public ResponseEntity<ApiResponse<Void>> deleteSlot(@PathVariable String slotId) {
        interviewService.deleteSlot(slotId);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
            .message("Xoá khung giờ phỏng vấn thành công.")
            .build());
    }

    /**
     * API dành cho Ứng viên tự chọn lịch phỏng vấn.
     */
    @PostMapping("/book")
    public ResponseEntity<ApiResponse<InterviewResponse>> bookInterview(@RequestParam String slotId) {
        InterviewResponse result = interviewService.bookInterview(slotId);
        ApiResponse<InterviewResponse> response = ApiResponse.<InterviewResponse>builder()
                .result(result)
                .message("Đặt lịch phỏng vấn thành công.")
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * API dành cho Ứng viên xem danh sách lịch phỏng vấn mà mình đã đặt.
     */
    @GetMapping("/my-interviews")
    public ResponseEntity<ApiResponse<List<InterviewResponse>>> getMyInterviews() {
        List<InterviewResponse> result = interviewService.getMyInterviews();
        return ResponseEntity.ok(ApiResponse.<List<InterviewResponse>>builder()
                .result(result)
                .message("Lấy danh sách lịch phỏng vấn của bạn thành công.")
                .build());
    }

    /**
     * Lấy danh sách ứng viên đã đăng ký cho một Slot cụ thể.
     */
    @GetMapping("/slots/{slotId}/candidates")
    public ResponseEntity<ApiResponse<List<CandidateResponse>>> getCandidatesInSlot(@PathVariable String slotId) {
        List<CandidateResponse> result = interviewService.getCandidatesInSlot(slotId);

        return ResponseEntity.ok(ApiResponse.<List<CandidateResponse>>builder()
            .result(result)
            .message("Lấy danh sách ứng viên trong khung giờ thành công.")
            .build());
    }
}