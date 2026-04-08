package com.skillbridge.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(columnDefinition = "TEXT")
    private String embedding; // Lưu mảng float dưới dạng chuỗi JSON "[0.12, -0.45, ...]"

    @Column(columnDefinition = "JSON")
    private String metadata; // Thông tin thêm, VD: {"title": "Hướng dẫn đăng bài", "url": "/guide"}
}
