package com.skillbridge.backend.dto.response;

import lombok.*;

//@Data
//@Builder
//public class CandidateSkillResponse {
//    private String skillId;
//    private String skillName;
//    private Integer experienceYears;
//
//    public CandidateSkillResponse(String skillId,String skillName, Integer experienceYears) {
//        this.skillId = skillId;
//        this.skillName = skillName;
//        this.experienceYears = experienceYears;
//    }
//    public  CandidateSkillResponse(){}
//
//    public String getSkillId() {
//        return skillId;
//    }
//
//    public void setSkillId(String skillId) {
//        this.skillId = skillId;
//    }
//
//    public String getSkillName() {
//        return skillName;
//    }
//
//    public void setSkillName(String skillName) {
//        this.skillName = skillName;
//    }
//
//    public Integer getExperienceYears() {
//        return experienceYears;
//    }
//
//    public void setExperienceYears(Integer experienceYears) {
//        this.experienceYears = experienceYears;
//    }
//}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidateSkillResponse {

    private String skillId;
    private String skillName;
    private Integer experienceYears;

}