package com.skillbridge.backend.entity;

import com.skillbridge.backend.enums.SlotStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "interview_slots")
public class InterviewSlot extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36)
    @Setter(AccessLevel.NONE)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(name = "location_link", length = 500)
    private String locationLink;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "capacity", nullable = false)
    @Builder.Default
    private Integer capacity = 1;

    @Column(name = "current_occupancy", nullable = false)
    @Builder.Default
    private Integer currentOccupancy = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private SlotStatus status = SlotStatus.AVAILABLE;

    public boolean isFull() {
        return currentOccupancy >= capacity;
    }
}