package com.skillbridge.backend.dto.response;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidateResponse {
    private String id;
    private String name;
    private String avatar;
    private String email;
    private String phoneNumber;
    private String address;
    private String description;
    private Float aiMatchingScore;
    private String category;
    private Object degrees;
    private Object skills;
    private Object experience;
    private String jobStatus;
}