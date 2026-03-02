package com.skillbridge.backend.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "user_id", length = 50)
    private String id;

    @NotBlank(message = "Tên không được để trống")
    @Column(name = "name", nullable = false)
    private String name;

    @Email(message = "Email không đúng định dạng")
    @NotBlank(message = "Email không được để trống")
    @Column(name = "email", nullable = false, unique = true)
    private String email;


//    @NotBlank(message = "Số điện thoại không hợp lệ")
    @Pattern(
            regexp = "^(0[3|5|7|8|9])[0-9]{8}$|^(\\+84[3|5|7|8|9])[0-9]{8}$",
            message = "Số điện thoại không hợp lệ"
    )
    @Column(name = "phone_number", length = 15)
    private String phoneNumber;

    @Column(name = "address")
    private String address;

//    @NotBlank
    @Column(name = "password")
    private String password;

    @Column(name = "role", nullable = false)
    private String role = "CANDIDATE";

    @Column(name = "status", nullable = false)
    private String status = "ACTIVE";

    @Column(name = "refresh_token")
    private String refreshToken;

    @Column(name = "is_2fa_enabled", nullable = false)
    private String is2faEnabled = "false";

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column
    private String provider;


    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    public String getProvider() {
        return provider;
    }
    public void setProvider(String provider) {
        this.provider = provider;
    }
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
    public String getIs2faEnabled() {
        return is2faEnabled;
    }

    public String getPhoneNumber() {

        return phoneNumber;
    }
    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }
    public String getAddress() {
        return address;
    }
    public void setAddress(String address) {
        this.address = address;
    }
    public void setIs2faEnabled(String is2faEnabled) {
        this.is2faEnabled = is2faEnabled;
    }
    public String getId() {
        return id;
    }
    public void setId(String id) {
        this.id = id;
    }
    public String getEmail() {
        return email;
    }
    public void setEmail(String email) {
        this.email = email;
    }
    public String getPassword() {
        return password;
    }
    public void setPassword(String password) {
        this.password = password;
    }
    public String getRole() {
        return role;
    }
    public void setRole(String role) {
        this.role = role;
    }
    public String getStatus() {
        return status;
    }
    public void setStatus(String status) {
        this.status = status;
    }
    public String getRefreshToken() {
        return refreshToken;
    }
    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
