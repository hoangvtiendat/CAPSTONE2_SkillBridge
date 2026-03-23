package com.skillbridge.backend.dto.response;

import java.util.List;

public record CvAnalysisResponse(
        List<String> matched_skills,
        List<String> missing_skills,
        List<String> irrelevant_skills,
        String summary,
        int fit_score
) {}
