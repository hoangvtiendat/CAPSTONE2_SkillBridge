package com.skillbridge.backend.dto.response;

import java.util.List;

// Java Record ánh xạ đúng 2 mảng AI trả về
public record SkillAnalysisResult(
        List<String> matched_skills,
        List<String> missing_skills,
        List<String> irrelevant_skills
) {}