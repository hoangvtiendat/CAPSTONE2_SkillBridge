package com.skillbridge.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.Date;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "invalidated_tokens")
public class InvalidatedToken {
    @Id
    private String id;

    @Column(name = "expiry_time", nullable = false)
    private Date expiryTime;
}