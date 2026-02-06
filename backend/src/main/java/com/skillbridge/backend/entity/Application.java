package com.skillbridge.backend.entity;

import com.skillbridge.backend.enums.ApplicationStatus;
import jakarta.persistence.*;
/// Done
@Entity
@Table(name = "applications")
public class Application extends BaseEntity{

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id")
    private Job job;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id")
    private Candidate candidate;

    @Column(name = "ai_matching_score")
    private Float aiMatchingScore;

    @Enumerated(EnumType.STRING)
    private ApplicationStatus status;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Job getJob() {
        return job;
    }

    public void setJob(Job job) {
        this.job = job;
    }

    public Candidate getCandidate() {
        return candidate;
    }

    public void setCandidate(Candidate candidate) {
        this.candidate = candidate;
    }

    public Float getAiMatchingScore() {
        return aiMatchingScore;
    }

    public void setAiMatchingScore(Float aiMatchingScore) {
        this.aiMatchingScore = aiMatchingScore;
    }

    public ApplicationStatus getStatus() {
        return status;
    }

    public void setStatus(ApplicationStatus status) {
        this.status = status;
    }
}