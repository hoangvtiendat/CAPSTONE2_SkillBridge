package com.skillbridge.backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BatchEvaluationRequest {
    private String jobId;
    private List<String> candidateIds;
}