package com.skillbridge.backend.dto.response;

import com.skillbridge.backend.dto.RoadmapDTO;

import java.util.List;
import java.util.Map;

public class CVJobEvaluationResponse {
    String candidateId;
    String candidateName;
    String jobId;
    private String titleJob;
    Double matchScore;
    String strengths;
    String weaknesses;
    List<RoadmapDTO> roadmap;

    public CVJobEvaluationResponse() {
    }

    public CVJobEvaluationResponse(String candidateId, String candidateName, String jobId,String titleJob, Double matchScore, String strengths, String weaknesses, List<RoadmapDTO> roadmap) {
        this.candidateId = candidateId;
        this.candidateName = candidateName;
        this.jobId = jobId;
        this.titleJob = titleJob;
        this.matchScore = matchScore;
        this.strengths = strengths;
        this.weaknesses = weaknesses;
        this.roadmap = roadmap;
    }

    public String getCandidateId() {
        return candidateId;
    }

    public void setCandidateId(String candidateId) {
        this.candidateId = candidateId;
    }

    public String getCandidateName() {
        return candidateName;
    }

    public void setCandidateName(String candidateName) {
        this.candidateName = candidateName;
    }

    public String getJobId() {
        return jobId;
    }

    public void setJobId(String jobId) {
        this.jobId = jobId;
    }

    public String getTitleJob() {
        return titleJob;
    }

    public void setTitleJob(String titleJob) {
        this.titleJob = titleJob;
    }

    public Double getMatchScore() {
        return matchScore;
    }

    public void setMatchScore(Double matchScore) {
        this.matchScore = matchScore;
    }

    public String getStrengths() {
        return strengths;
    }

    public void setStrengths(String strengths) {
        this.strengths = strengths;
    }

    public String getWeaknesses() {
        return weaknesses;
    }

    public void setWeaknesses(String weaknesses) {
        this.weaknesses = weaknesses;
    }

    public List<RoadmapDTO> getRoadmap() {
        return roadmap;
    }

    public void setRoadmap(List<RoadmapDTO> roadmap) {
        this.roadmap = roadmap;
    }
}