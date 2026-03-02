package com.skillbridge.backend.service;

import dev.langchain4j.model.embedding.AllMiniLmL6V2EmbeddingModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import org.springframework.stereotype.Service;

@Service
public class EmbeddingService {
        private final EmbeddingModel embeddingModel = new AllMiniLmL6V2EmbeddingModel();//384 dimensions
        public float[] createEmbedding(String word) {
            return embeddingModel.embed(word).content().vector();
        }
}
