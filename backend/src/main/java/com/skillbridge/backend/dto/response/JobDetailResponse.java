package com.skillbridge.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class JobDetailResponse {

    String jobId;
    Object title;
    String description;
    String position;
    String location;

    BigDecimal salaryMin;
    BigDecimal salaryMax;

    String status;
    String moderationStatus;

    Integer viewCount;

    String companyId;
    String companyName;
    String companyImageUrl;

    String categoryName;
    List<String> skills;

    LocalDateTime createdAt;

}