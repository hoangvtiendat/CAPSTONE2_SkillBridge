package com.skillbridge.backend.entity;

import com.skillbridge.backend.utils.JsonConverter;
import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "candidates")
public class Candidate extends BaseEntity {
    @Id
    @Column(name = "user_id")
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String address;

    @Column(name = "cv_url")
    private String cvUrl;

    @Column(name = "parsed_content_json", columnDefinition = "JSON")
    private String parsedContentJson;

    @Column(name = "vector_embedding", columnDefinition = "JSON")
    private String vectorEmbedding;

    @Column(name = "is_open_to_work")
    @Builder.Default
    private Boolean isOpenToWork = true;

    @Convert(converter = JsonConverter.class)
    @Column(columnDefinition = "JSON")
    private Object experience;

    @Convert(converter = JsonConverter.class)
    @Column(columnDefinition = "JSON")
    private Object degree;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;
}