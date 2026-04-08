package com.skillbridge.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")
public class User extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "user_id", length = 36)
    @Setter(AccessLevel.NONE)
    private String id;

    @NotBlank(message = "Tên không được để trống")
    @Column(nullable = false)
    private String name;

    @Email(message = "Email không đúng định dạng")
    @NotBlank(message = "Email không được để trống")
    @Column(nullable = false, unique = true)
    private String email;

    @Pattern(
            regexp = "^(0[3|5|7|8|9])[0-9]{8}$|^(\\+84[3|5|7|8|9])[0-9]{8}$",
            message = "Số điện thoại không hợp lệ"
    )
    @Column(name = "phone_number", length = 15)
    private String phoneNumber;

    private String address;

    private String avatar;

    private String password;

    @Builder.Default
    @Column(nullable = false)
    private String role = "CANDIDATE";

    @Builder.Default
    @Column(nullable = false)
    private String status = "ACTIVE";

    @Column(name = "refresh_token")
    private String refreshToken;

    @Builder.Default
    @Column(name = "is_2fa_enabled", nullable = false)
    private String is2faEnabled = "false";

    private String provider;

    // --- Các trường Transient (Dùng cho logic Mapping/DTO, không lưu DB) ---
    @Transient
    private String companyName;

    @Transient
    private String companyId;

    @Transient
    private String companyTaxId;

    @Transient
    private String companyStatus;

    @Transient
    private String companyRole;
}