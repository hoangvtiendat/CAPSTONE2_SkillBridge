package com.skillbridge.backend.config;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class KeywordConfig {
    private List<KeywordGroup> degrees;
    private List<KeywordGroup> certificates;
    private List<KeywordGroup> majors;

    @JsonProperty("experience_keywords")
    private List<String> experienceKeywords;

    @JsonProperty("salary_keywords")
    private List<String> salaryKeywords;

    @JsonProperty("ocr_noise_replacement")
    private Map<String, String> ocrNoiseReplacement;

    public List<KeywordGroup> getDegrees() {
        return degrees;
    }

    public void setDegrees(List<KeywordGroup> degrees) {
        this.degrees = degrees;
    }

    public List<KeywordGroup> getCertificates() {
        return certificates;
    }

    public void setCertificates(List<KeywordGroup> certificates) {
        this.certificates = certificates;
    }

    public List<KeywordGroup> getMajors() {
        return majors;
    }

    public void setMajors(List<KeywordGroup> majors) {
        this.majors = majors;
    }

    public List<String> getExperienceKeywords() {
        return experienceKeywords;
    }

    public void setExperienceKeywords(List<String> experienceKeywords) {
        this.experienceKeywords = experienceKeywords;
    }

    public List<String> getSalaryKeywords() {
        return salaryKeywords;
    }

    public void setSalaryKeywords(List<String> salaryKeywords) {
        this.salaryKeywords = salaryKeywords;
    }

    public Map<String, String> getOcrNoiseReplacement() {
        return ocrNoiseReplacement;
    }

    public void setOcrNoiseReplacement(Map<String, String> ocrNoiseReplacement) {
        this.ocrNoiseReplacement = ocrNoiseReplacement;
    }
}

// Tách hẳn ra ngoài hoặc để cùng file nhưng không lồng trong class KeywordConfig
@Data
@NoArgsConstructor
@AllArgsConstructor
class KeywordGroup {
    private String standard;
    private List<String> synonyms;

    public String getStandard() {
        return standard;
    }

    public void setStandard(String standard) {
        this.standard = standard;
    }

    public List<String> getSynonyms() {
        return synonyms;
    }

    public void setSynonyms(List<String> synonyms) {
        this.synonyms = synonyms;
    }
}