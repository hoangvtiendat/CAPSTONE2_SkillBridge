package com.skillbridge.backend.dto.request;

import java.time.LocalDate;

public class UserCreationRequest {
    private String password;
    private String email;
    private String role = "CANDIDATE";
    private String status = "ACTIVE";
    private String is2faEnabled;

    public String getIs2faEnabled() {
        return is2faEnabled;
    }

    public void setIs2faEnabled(String is2faEnabled) {
        this.is2faEnabled = is2faEnabled;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
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
}
