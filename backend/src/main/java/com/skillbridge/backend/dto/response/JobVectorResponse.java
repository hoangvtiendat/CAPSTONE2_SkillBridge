package com.skillbridge.backend.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class JobVectorResponse {
    public String id;
    public float[] vectorEmbedding;
    public JobVectorResponse(String id, float[] vectorEmbedding) {
        this.id = id;
        this.vectorEmbedding = vectorEmbedding;
    }
}
