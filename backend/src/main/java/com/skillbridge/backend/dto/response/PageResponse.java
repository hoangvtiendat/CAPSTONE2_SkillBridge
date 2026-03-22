package com.skillbridge.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class PageResponse<T> {
    private int currentPage;
    private int totalPages;
    private long totalElements;
    private List<T> data;
}