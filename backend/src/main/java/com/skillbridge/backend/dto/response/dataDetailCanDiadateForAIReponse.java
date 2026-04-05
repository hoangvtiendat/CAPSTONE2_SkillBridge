package com.skillbridge.backend.dto.response;


import com.skillbridge.backend.dto.request.SkillRequest;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class dataDetailCanDiadateForAIReponse {
    private String category;
    private String location;
    private List<DegreeResponse> degrees;
    private List<SkillRequest> skills;
}
