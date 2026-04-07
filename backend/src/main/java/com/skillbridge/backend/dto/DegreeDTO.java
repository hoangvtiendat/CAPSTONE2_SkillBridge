package com.skillbridge.backend.dto;

import lombok.Data;

@Data
public class DegreeDTO {
    private String type;
    private String major;
    private String degree;
    private String institution;
    private String graduationYear;

    // dùng cho CERTIFICATE
    private String name;
    private String year;

    public DegreeDTO() {
    }

    public DegreeDTO(String type, String major, String degree, String institution, String graduationYear, String name, String year) {
        this.type = type;
        this.major = major;
        this.degree = degree;
        this.institution = institution;
        this.graduationYear = graduationYear;
        this.name = name;
        this.year = year;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getMajor() {
        return major;
    }

    public void setMajor(String major) {
        this.major = major;
    }

    public String getDegree() {
        return degree;
    }

    public void setDegree(String degree) {
        this.degree = degree;
    }

    public String getInstitution() {
        return institution;
    }

    public void setInstitution(String institution) {
        this.institution = institution;
    }

    public String getGraduationYear() {
        return graduationYear;
    }

    public void setGraduationYear(String graduationYear) {
        this.graduationYear = graduationYear;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getYear() {
        return year;
    }

    public void setYear(String year) {
        this.year = year;
    }
}
