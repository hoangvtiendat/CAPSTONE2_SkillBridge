package com.skillbridge.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillbridge.backend.entity.ChatDocument;
import com.skillbridge.backend.repository.ChatDocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class KnowledgeBaseService {

    private final ChatDocumentRepository repository;
    private final EmbeddingService embeddingService;
    private final ObjectMapper objectMapper;

    /**
     * Nhận danh sách các đoạn text, tạo embedding và lưu vào DB
     */
    public void loadKnowledgeBase(List<Map<String, String>> docs) {
        log.info("Loading {} documents into Knowledge Base...", docs.size());
        
        for (Map<String, String> docMap : docs) {
            String content = docMap.get("content");
            String title = docMap.getOrDefault("title", "Unknown");
            
            if (content == null || content.isBlank()) continue;

            try {
                // Tạo vector
                float[] embedding = embeddingService.createEmbedding(content);
                String embeddingJson = objectMapper.writeValueAsString(embedding);

                // Khởi tạo metadata
                String metadataJson = objectMapper.writeValueAsString(Map.of("title", title));

                // Lưu vào DB
                ChatDocument chatDocument = ChatDocument.builder()
                        .content(content)
                        .embedding(embeddingJson)
                        .metadata(metadataJson)
                        .build();

                repository.save(chatDocument);
                log.debug("Saved document: {}", title);
            } catch (JsonProcessingException e) {
                log.error("Failed to parse embedding or metadata to JSON for doc {}", title, e);
            } catch (Exception e) {
                log.error("Error creating embedding for doc {}", title, e);
            }
        }
        
        log.info("Knowledge Base loaded successfully!");
    }
    
    public void clearKnowledgeBase() {
        repository.deleteAll();
        log.info("Knowledge Base cleared!");
    }
}
