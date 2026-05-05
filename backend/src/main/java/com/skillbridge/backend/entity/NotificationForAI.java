package com.skillbridge.backend.entity; // Đặt ở đây là đúng chuẩn rồi nhé!

import com.skillbridge.backend.enums.JobStatus;
import jakarta.persistence.*;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "notification_for_ai")
public class NotificationForAI {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  @Column(length = 36)
  @Setter(AccessLevel.NONE)
  private String id;

  private String userId;

  private String objId;

  private String title;

  @Enumerated(EnumType.STRING)
  private JobStatus status;

  @Column(columnDefinition = "TEXT")
  private String message;

  private String action;
  private String company;
}