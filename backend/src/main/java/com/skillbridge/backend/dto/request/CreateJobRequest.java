package com.skillbridge.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import java.util.List;
import java.util.Map;

@Getter
@Setter
public class CreateJobRequest {
    @NotBlank(message = "Vị trí công việc không được để trống")
    private String position;

    @NotEmpty(message = "Tiêu đề không được để trống")
    private Map<String, Object> title;

    @NotBlank(message = "Mô tả không được để trống")
    private String description;

    @NotBlank(message = "Danh mục không được để trống")
    private String categoryId;

    private String salaryMin;
    private String salaryMax;
    private String location;
    @NotEmpty(message = "Danh sách kĩ năng không được để trống")
    private List<JobSkillRequest> skills;

}