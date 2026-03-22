package com.skillbridge.backend.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TwoFactorToggleRequest {

    @NotNull(message = "FIELD_REQUIRED")
    @JsonProperty("isEnabled")
    Boolean isEnabled;
}