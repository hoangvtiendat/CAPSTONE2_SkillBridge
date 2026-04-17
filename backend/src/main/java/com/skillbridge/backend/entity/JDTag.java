package com.skillbridge.backend.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Data;
import lombok.Setter;

@Entity
@Data
public class JDTag {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36)
    @Setter(AccessLevel.NONE)
    private String id;
    private String name;
}
