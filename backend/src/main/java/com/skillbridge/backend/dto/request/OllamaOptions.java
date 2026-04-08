package com.skillbridge.backend.dto.request;

import lombok.Builder;
import com.fasterxml.jackson.annotation.JsonInclude;

@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public record OllamaOptions(
        Double temperature,
        Integer top_k,
        Double top_p,
        Integer num_predict,
        Integer num_ctx,
        Integer seed
) {}