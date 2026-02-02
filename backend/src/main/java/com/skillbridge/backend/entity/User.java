package com.skillbridge.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Entity
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "user_id",length = 50)
    private String id;

    @Email
    @NotBlank
    @Column(name="email", nullable = false,unique = true)
    private String email;

    @NotBlank
    @Size(min=8)
    @Column(name="password", nullable = false)
    private String password;

    @Column(name="role", nullable = false)
    private String role = "CANDIDATE";

    @Column(name="status",nullable = false)
    private String status = "ACTIVE";

    @Column(name="refresh_token")
    private String refreshToken;

    @Column(name="is_2fa_enabled", nullable = false)
    private boolean is2faEnabled = false;

    @Column(name="created_at", nullable = false,updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate(){
        this.createdAt = LocalDateTime.now();
    }

    public boolean isIs2faEnabled() {
        return is2faEnabled;
    }

    public void setIs2faEnabled(boolean is2faEnabled) {
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
