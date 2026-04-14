package com.skillbridge.backend.controller;

import com.skillbridge.backend.dto.response.ApiResponse;
import com.skillbridge.backend.dto.response.AnalyticsResponse;
import com.skillbridge.backend.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;

@RestController
@RequestMapping("/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/recruiter/summary")
    @PreAuthorize("hasAnyRole('RECRUITER', 'ADMIN')")
    public ResponseEntity<ApiResponse<AnalyticsResponse>> getRecruiterSummary(
            @RequestParam(required = false) String jobId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate) {
        
        LocalDateTime startLocal = startDate != null ? startDate.atZoneSameInstant(ZoneId.systemDefault()).toLocalDateTime() : null;
        LocalDateTime endLocal = endDate != null ? endDate.atZoneSameInstant(ZoneId.systemDefault()).toLocalDateTime() : null;

        AnalyticsResponse result = analyticsService.getRecruiterAnalytics(jobId, startLocal, endLocal);
        return ResponseEntity.ok(new ApiResponse<>(HttpStatus.OK.value(), "Success", result));
    }

    @GetMapping("/recruiter/export")
    @PreAuthorize("hasAnyRole('RECRUITER', 'ADMIN')")
    public ResponseEntity<byte[]> exportAnalyticsCsv(
            @RequestParam(required = false) String jobId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate) {
        
        LocalDateTime startLocal = startDate != null ? startDate.atZoneSameInstant(ZoneId.systemDefault()).toLocalDateTime() : null;
        LocalDateTime endLocal = endDate != null ? endDate.atZoneSameInstant(ZoneId.systemDefault()).toLocalDateTime() : null;

        byte[] csvData = analyticsService.exportAnalyticsToCsv(jobId, startLocal, endLocal);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=recruitment_analytics.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvData);
    }
}
