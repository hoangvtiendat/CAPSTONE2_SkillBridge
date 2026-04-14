package com.skillbridge.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillbridge.backend.entity.KnowledgeBase;
import com.skillbridge.backend.repository.KnowledgeBaseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.PriorityQueue;

@Service
@Slf4j
@RequiredArgsConstructor
public class VectorSearchService {

    private final KnowledgeBaseRepository repository;
    private final ObjectMapper objectMapper;

    /**
     * Tìm top K văn bản có độ tương đồng cosine cao nhất với query vector.
     */
    public List<KnowledgeBase> searchTopK(float[] queryEmbedding, int k) {
        List<KnowledgeBase> allDocs = repository.findAll();

        if (allDocs.isEmpty()) {
            return List.of();
        }

        // Dùng PriorityQueue để giữ k documents có điểm cao nhất
        PriorityQueue<DocumentScore> pq = new PriorityQueue<>(
                Comparator.comparingDouble(DocumentScore::score)
        );

        for (KnowledgeBase doc : allDocs) {
            try {
                float[] docEmbedding = objectMapper.readValue(doc.getEmbedding(), float[].class);
                double score = cosineSimilarity(queryEmbedding, docEmbedding);

                pq.offer(new DocumentScore(doc, score));
                if (pq.size() > k) {
                    pq.poll(); // Bỏ phần tử có điểm thấp nhất
                }
            } catch (JsonProcessingException e) {
                log.error("Failed to parse embedding for doc id {}", doc.getId(), e);
            }
        }

        return pq.stream()
                .sorted(Comparator.comparingDouble(DocumentScore::score).reversed())
                .map(DocumentScore::document)
                .toList();
    }

    private double cosineSimilarity(float[] v1, float[] v2) {
        if (v1.length != v2.length) {
            throw new IllegalArgumentException("Vectors must have the same length");
        }
        double dotProduct = 0.0;
        double normV1 = 0.0;
        double normV2 = 0.0;
        for (int i = 0; i < v1.length; i++) {
            dotProduct += v1[i] * v2[i];
            normV1 += v1[i] * v1[i];
            normV2 += v2[i] * v2[i];
        }
        if (normV1 == 0 || normV2 == 0) return 0;
        return dotProduct / (Math.sqrt(normV1) * Math.sqrt(normV2));
    }

    private record DocumentScore(KnowledgeBase document, double score) {}
}
