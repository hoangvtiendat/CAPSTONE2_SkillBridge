package com.skillbridge.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class JobResponse {
    private String id;
    private Map<String, Object> title;
    private String position;
    private String description;
    private String location;
    private String status;
    private String salaryMin;
    private String salaryMax;

    private CategoryDTO category;

    private CompanyDTO company;
    private List<JobSkillDTO> skills;
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