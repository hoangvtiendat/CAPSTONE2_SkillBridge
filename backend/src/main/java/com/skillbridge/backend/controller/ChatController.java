package com.skillbridge.backend.controller;

import com.skillbridge.backend.dto.request.ChatRequest;
import com.skillbridge.backend.dto.response.ApiResponse;
import com.skillbridge.backend.dto.response.ChatResponse;
import com.skillbridge.backend.service.ChatService;
import com.skillbridge.backend.service.KnowledgeBaseService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000", maxAge = 3600)
public class ChatController {

    private final ChatService chatService;
    private final KnowledgeBaseService knowledgeBaseService;

    @PostMapping
    public ApiResponse<ChatResponse> chat(@RequestBody ChatRequest request) {
        ChatResponse response = chatService.chat(request.getMessage());
        return ApiResponse.<ChatResponse>builder()
                .result(response)
                .build();
    }

    @PostMapping("/knowledge-base/load")
    public ApiResponse<String> loadKnowledgeBase(@RequestBody List<Map<String, String>> documents) {
        knowledgeBaseService.loadKnowledgeBase(documents);
        return ApiResponse.<String>builder()
                .result("Tải nội dung Knowledge Base thành công!")
                .build();
    }

    @DeleteMapping("/knowledge-base")
    public ApiResponse<String> clearKnowledgeBase() {
        knowledgeBaseService.clearKnowledgeBase();
        return ApiResponse.<String>builder()
                .result("Xóa nội dung Knowledge Base thành công!")
                .build();
    }
}
