package com.skillbridge.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DegreeResponse {

    /**
     * Phân loại: DEGREE (Bằng cấp) hoặc CERTIFICATE (Chứng chỉ)
     */
    String type;

    // Các trường dành cho Bằng cấp (Degree)
    String degree;
    String major;
    String institution;
    String graduationYear;

    // Các trường dành cho Chứng chỉ (Certificate)
    String name;
    String year;

}