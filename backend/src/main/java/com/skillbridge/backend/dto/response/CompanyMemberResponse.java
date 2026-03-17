package com.skillbridge.backend.dto.response;

import com.skillbridge.backend.enums.CompanyRole;

public class CompanyMemberResponse {
    private String id;
    private String companyId;
    private String companyName;
    private String companyDescription;
    private String companyWebsiteUrl;
    private String recruiterId;
    private CompanyRole role;
    private String recruiterName;
    private String recruiterStatus;
    private String recruiterAddress;
    private String recruiterEmail;
    private String recruiterPhoneNumber;

    public CompanyMemberResponse(String id, String companyId, String companyName, String companyDescription, String companyWebsiteUrl, String recruiterId, CompanyRole role, String recruiterName, String recruiterStatus, String recruiterAddress, String recruiterEmail, String recruiterPhoneNumber) {
        this.id = id;
        this.companyId = companyId;
        this.companyName = companyName;
        this.companyDescription = companyDescription;
        this.companyWebsiteUrl = companyWebsiteUrl;
        this.recruiterId = recruiterId;
        this.role = role;
        this.recruiterName = recruiterName;
        this.recruiterStatus = recruiterStatus;
        this.recruiterAddress = recruiterAddress;
        this.recruiterEmail = recruiterEmail;
        this.recruiterPhoneNumber = recruiterPhoneNumber;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getCompanyId() {
        return companyId;
    }

    public void setCompanyId(String companyId) {
        this.companyId = companyId;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getCompanyDescription() {
        return companyDescription;
    }

    public void setCompanyDescription(String companyDescription) {
        this.companyDescription = companyDescription;
    }

    public String getCompanyWebsiteUrl() {
        return companyWebsiteUrl;
    }

    public void setCompanyWebsiteUrl(String companyWebsiteUrl) {
        this.companyWebsiteUrl = companyWebsiteUrl;
    }

    public String getRecruiterId() {
        return recruiterId;
    }

    public void setRecruiterId(String recruiterId) {
        this.recruiterId = recruiterId;
    }

    public CompanyRole getRole() {
        return role;
    }

    public void setRole(CompanyRole role) {
        this.role = role;
    }

    public String getRecruiterName() {
        return recruiterName;
    }

    public void setRecruiterName(String recruiterName) {
        this.recruiterName = recruiterName;
    }

    public String getRecruiterStatus() {
        return recruiterStatus;
    }

    public void setRecruiterStatus(String recruiterStatus) {
        this.recruiterStatus = recruiterStatus;
    }

    public String getRecruiterAddress() {
        return recruiterAddress;
    }

    public void setRecruiterAddress(String recruiterAddress) {
        this.recruiterAddress = recruiterAddress;
    }

    public String getRecruiterEmail() {
        return recruiterEmail;
    }

    public void setRecruiterEmail(String recruiterEmail) {
        this.recruiterEmail = recruiterEmail;
    }

    public String getRecruiterPhoneNumber() {
        return recruiterPhoneNumber;
    }

    public void setRecruiterPhoneNumber(String recruiterPhoneNumber) {
        this.recruiterPhoneNumber = recruiterPhoneNumber;
    }
}
