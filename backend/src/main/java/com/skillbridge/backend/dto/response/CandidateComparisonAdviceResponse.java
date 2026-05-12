package com.skillbridge.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CandidateComparisonAdviceResponse {
    /**
     * FIRST = ứng viên tương ứng applicationIdA phù hợp hơn;
     * SECOND = applicationIdB;
     * EQUAL = không chênh lệch rõ rệt.
     */
    String betterFit;
    String headline;
    String comparisonSummary;
    List<String> firstCandidateHighlights;
    List<String> secondCandidateHighlights;
    List<String> firstCandidateWeaknesses;
    List<String> secondCandidateWeaknesses;
    String hiringRecommendation;
}
