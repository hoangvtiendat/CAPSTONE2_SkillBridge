package com.skillbridge.backend.dto.response;

import com.skillbridge.backend.enums.CompanyRole;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CompanyMemberResponse {

    String id;
    String companyId;
    String companyName;
    String companyDescription;
    String companyWebsiteUrl;
    String recruiterId;
    CompanyRole role;
    String recruiterName;
    String recruiterStatus;
    String recruiterAddress;
    String recruiterEmail;
    String recruiterPhoneNumber;
    Long totalPosts;
}