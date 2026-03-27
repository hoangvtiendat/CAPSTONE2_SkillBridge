package com.skillbridge.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "cv_job_evaluations")
public class CVJobEvaluation extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id", nullable = false)
    Candidate candidate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false)
    Job job;

    @Column(name = "match_score")
    Double matchScore;

    @Column(name = "strengths", columnDefinition = "TEXT")
    String strengths;

    @Column(name = "weaknesses", columnDefinition = "TEXT")
    String weaknesses;

    @Column(name = "roadmap", columnDefinition = "TEXT")
    String roadmap;

    @Builder.Default
    @Column(name = "is_candidate")
    Boolean isCandidate = false;

    @Builder.Default
    @Column(name = "is_recruiter")
    Boolean isRecruiter = false;

    @Builder.Default
    @Column(name = "is_apply")
    Boolean isApply = false;
}