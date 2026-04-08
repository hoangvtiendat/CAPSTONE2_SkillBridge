package com.skillbridge.backend.service;

import com.skillbridge.backend.dto.response.ChatResponse;
import com.skillbridge.backend.entity.ChatDocument;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class ChatService {

    private final EmbeddingService embeddingService;
    private final VectorSearchService vectorSearchService;
    private final GeminiService geminiService;

    private static final String SYSTEM_PROMPT = """
            Bạn là trợ lý AI hỗ trợ người dùng sử dụng ứng dụng.
            Chỉ trả lời dựa trên context.
            Không được bịa thông tin.
            Nếu không biết -> nói không có thông tin.
            Trả lời rõ ràng, từng bước nếu là hướng dẫn.
            ĐẶC BIỆT LƯU Ý: BẮT BUỘC TRẢ VỀ DỮ LIỆU DƯỚI DẠNG JSON CÓ CẤU TRÚC NHƯ SAU:
            {
              "answer": "Nội dung câu trả lời của bạn"
            }
            """;

    private static final String USER_PROMPT_TEMPLATE = """
            %s
            
            CONTEXT:
            %s
            
            ---
            CÂU HỎI:
            %s
            
            ---
            TRẢ LỜI:
            """;

    /**
     * Xử lý luồng RAG: message -> embed -> search -> prompt -> LLM
     */
    public ChatResponse chat(String message) {
        log.info("Processing chat message: {}", message);

        long startTime = System.currentTimeMillis();
        // 1. Tạo embedding từ câu hỏi
        float[] queryEmbedding = embeddingService.createEmbedding(message);
        log.debug("Embedded message in {} ms", (System.currentTimeMillis() - startTime));

        // 2. Tìm top K documents (K=3)
        List<ChatDocument> topDocs = vectorSearchService.searchTopK(queryEmbedding, 3);
        
        String context = topDocs.stream()
                .map(ChatDocument::getContent)
                .collect(Collectors.joining("\n\n---\n\n"));

        log.debug("Found {} relevant documents for context", topDocs.size());

        // 3. Build Prompt
        String finalPrompt = String.format(USER_PROMPT_TEMPLATE, SYSTEM_PROMPT, context, message);

        // 4. Gọi LLM
        return geminiService.callGemini(finalPrompt, ChatResponse.class);
    }
}
