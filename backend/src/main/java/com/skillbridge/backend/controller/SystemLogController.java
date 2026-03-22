package com.skillbridge.backend.controller;

import com.skillbridge.backend.dto.CompanyDTO;
import com.skillbridge.backend.dto.response.ApiResponse;
import com.skillbridge.backend.dto.response.CursorResponse;
import com.skillbridge.backend.entity.SystemLog;
import com.skillbridge.backend.service.SystemLogService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/logs")
public class SystemLogController {
    SystemLogService systemLogService;

    @GetMapping
    public ResponseEntity<ApiResponse<CursorResponse<SystemLog>>> getLog(
            @RequestParam(value = "cursor", required = false) String cursor,
            @RequestParam(value = "limit", defaultValue = "20") int limit,
            @RequestParam(value = "level", required = false) String level,
            @RequestParam(value = "date", required = false) String date
    ) {
        CursorResponse<SystemLog> logsResponse = systemLogService.getLogs(cursor, limit, level, date);

        ApiResponse<CursorResponse<SystemLog>> response = new ApiResponse<>();
        response.setCode(HttpStatus.OK.value());
        response.setResult(logsResponse);
        response.setMessage(logsResponse.getData() != null && !logsResponse.getData().isEmpty()
                ? "Tra cứu thành công"
                : "Không tìm thấy thông tin");
        return ResponseEntity.ok(response);
    }
}
