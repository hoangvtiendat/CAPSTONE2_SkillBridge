package com.skillbridge.backend.entity;


import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Data;
import lombok.Setter;

@Entity
@Data
@Table(name = "jd_similarities")
public class JD_Similarities {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36)
    @Setter(AccessLevel.NONE)
    private String id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "source_jd_id_id")
    Job source_jd_id;
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "target_jd_id")
    Job target_jd_id;
    double similarity;

}
