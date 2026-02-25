package com.skillbridge.backend.controller;

import com.skillbridge.backend.dto.CompanyDTO;
import com.skillbridge.backend.dto.response.ApiResponse;
import com.skillbridge.backend.entity.SystemLog;
import com.skillbridge.backend.service.SystemLogService;
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
@RequestMapping("Logs")
public class SystemLogController {
    @Autowired
    private final  SystemLogService systemLogService;

    public SystemLogController(SystemLogService systemLogService) {
        this.systemLogService = systemLogService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SystemLog>>> getLog(
        @RequestParam(value = "cursor", required = false) String cursor,
        @RequestParam(value = "limit", defaultValue = "20" ) int limit,
        @RequestParam(value = "level",required = false) String level,
        @RequestParam(value = "date",required = false) String date
    ){
        List<SystemLog> logs = systemLogService.getLogs(cursor, limit, level,date);
        boolean hasMore = logs.size() > limit;
        String nextCursor = null;
        List<SystemLog> resultLogs = new ArrayList<>(logs);

        if (hasMore) {
            resultLogs.remove(limit);
            nextCursor = resultLogs.get(resultLogs.size() - 1).getId();
        }

        ApiResponse<List<SystemLog>> response = new ApiResponse<>();
        response.setCode(HttpStatus.OK.value());
        response.setResult(resultLogs);
        response.setMessage(resultLogs != null ? "Tra cứu thành công" : "Không tìm thấy thông tin");

        return ResponseEntity.ok(response);
    }
}
