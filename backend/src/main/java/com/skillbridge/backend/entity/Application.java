package com.skillbridge.backend.entity;

import com.skillbridge.backend.enums.ApplicationStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "applications")
public class Application extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @NotNull(message = "Công việc không được để trống")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false) // DB không cho phép null
    private Job job;

    @NotNull(message = "Ứng viên không được để trống")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id", nullable = false)
    private Candidate candidate;

    @NotBlank(message = "Họ tên không được để trống")
    @Size(max = 100, message = "Tên quá dài (tối đa 100 ký tự)")
    @Column(name = "full_name", nullable = false)
    private String fullName;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Định dạng email không hợp lệ")
    @Column(name = "email", nullable = false)
    private String email;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^[0-9]{10,11}$", message = "Số điện thoại phải từ 10-11 số")
    @Column(name = "phone_number", nullable = false, length = 15)
    private String phoneNumber;

    @NotBlank(message = "Vui lòng đính kèm CV")
    @Column(name = "cv_url", nullable = false)
    private String cvUrl;

    @Column(name = "recommendation_letter", columnDefinition = "TEXT")
    private String recommendationLetter;

    @Min(value = 0, message = "Điểm AI không thể nhỏ hơn 0")
    @Max(value = 100, message = "Điểm AI không thể lớn hơn 100")
    @Column(name = "ai_matching_score")
    private Float aiMatchingScore;

    @Column(name = "ai_analysis", columnDefinition = "TEXT")
    private String aiAnalysis;

    // Nếu ông dùng Hibernate 6+, nên dùng @JdbcTypeCode(SqlTypes.JSON)
    // để DB hiểu đây là cột JSON thực thụ (nếu dùng PostgreSQL/MySQL)
    @Column(name = "qualifications", columnDefinition = "JSON")
    private String qualifications;

    @NotNull(message = "Trạng thái hồ sơ không được để trống")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default // Giúp Builder mặc định là PENDING nếu không set
    private ApplicationStatus status = ApplicationStatus.PENDING;
}

