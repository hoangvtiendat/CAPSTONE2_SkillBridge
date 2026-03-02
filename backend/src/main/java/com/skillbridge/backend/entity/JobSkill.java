package com.skillbridge.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;

/// Done
@Entity
@Table(name = "job_skills")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobSkill extends BaseEntity{

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id")
    @JsonIgnore
    private Job job;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "skill_id")
    private Skill skill;

    @Column(name = "is_required")
    private Boolean isRequired;



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

    public Skill getSkill() {
        return skill;
    }

    public void setSkill(Skill skill) {
        this.skill = skill;
    }

    public Boolean getIsRequired() {
        return isRequired;
    }

    public void setIsRequired(Boolean required) {
        isRequired = required;
    }
}