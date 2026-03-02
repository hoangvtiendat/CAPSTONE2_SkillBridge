package com.skillbridge.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
/// Done
@Entity
@Table(name = "categories")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Data
public class Category extends BaseEntity{

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String name;

}

