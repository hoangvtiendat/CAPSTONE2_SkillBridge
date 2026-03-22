package com.skillbridge.backend.service;

import dev.langchain4j.model.embedding.AllMiniLmL6V2EmbeddingModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class EmbeddingService {
        EmbeddingModel embeddingModel = new AllMiniLmL6V2EmbeddingModel();//384 dimensions
        public float[] createEmbedding(String word) {
//            if (word == null || word.isBlank()) {
//                return new float[384];
//            }
//
//            try {
//                long startTime = System.currentTimeMillis();
//
//                float[] vector = embeddingModel.embed(word).content().vector();
//
//                long duration = System.currentTimeMillis() - startTime;
//                log.debug("[EMBEDDING] Vectorized text length: {} in {}ms", word.length(), duration);
//
//                return vector;
//            } catch (Exception e) {
//                log.error("[EMBEDDING-ERROR] Failed to create embedding: {}", e.getMessage());
//                return new float[384];
//            }
            return embeddingModel.embed(word).content().vector();
        }
}
