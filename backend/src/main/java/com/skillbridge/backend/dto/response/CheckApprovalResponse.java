package com.skillbridge.backend.dto.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CheckApprovalResponse {
    String jobId;
    Object title;
    float[] vector;


}
