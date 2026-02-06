package com.skillbridge.backend.entity;

import jakarta.persistence.*;
/// Done
@Entity
@Table(name = "candidates")
public class Candidate extends BaseEntity{

    @Id
    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn (name = "user_id")
    private User user; // dùng chung id với user

    private String cvUrl;

    @Column(columnDefinition = "json")
    private String parsedContentJson;

    @Column(columnDefinition = "json")
    private String vectorEmbedding;

    private Boolean isOpenToWork;

    private Integer yearsOfExperience;

    private Double expectedSalary;

    private String highestDegree;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;
}
