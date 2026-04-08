package com.skillbridge.backend.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@Getter
@Setter
@AllArgsConstructor
public class JobSemanticSearchResponse {
    private String id;
    private Map<String, Object> title;
    private String position;
    private String description;
    private String location;
    private String status;
    private BigDecimal salaryMin;
    private BigDecimal salaryMax;

    private JobResponse.CategoryDTO category;

    private JobResponse.CompanyDTO company;
    private List<JobResponse.JobSkillDTO> skills;
    public float[] vectorEmbedding;

    @Data
    @Builder
    public static class JobSkillDTO {
        private String name;
        private boolean required;
    }
    @Data
    @Builder
    public static class CategoryDTO {
        private String id;
        private String name;
    }

    @Data
    @Builder
    public static class CompanyDTO {
        private String id;
        private String name;
        private String logoUrl;
    }
}
