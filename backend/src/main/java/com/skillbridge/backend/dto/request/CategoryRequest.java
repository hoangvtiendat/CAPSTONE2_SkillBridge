package com.skillbridge.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CategoryRequest {

    @NotBlank(message = "CATEGORY_EXIST")
    @Size(max = 255, message = "INVALID_INPUT")
    String name;

    @Size(max = 500, message = "INVALID_INPUT")
    String description;
}