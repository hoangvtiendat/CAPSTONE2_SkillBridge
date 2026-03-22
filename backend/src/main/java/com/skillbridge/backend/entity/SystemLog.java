package com.skillbridge.backend.entity;

import com.skillbridge.backend.enums.LogLevel;
import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "system_logs")
public class SystemLog extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36)
    @Setter(AccessLevel.NONE)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String action;

    @Enumerated(EnumType.STRING)
    @Column(name = "log_level", length = 20)
    @Builder.Default
    private LogLevel logLevel = LogLevel.INFO;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;
}