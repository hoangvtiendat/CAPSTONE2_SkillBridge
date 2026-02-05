package com.skillbridge.backend.dto.request;

import lombok.Data;

@Data
public class RegisterRequest {
    private String email;

    public RegisterRequest(String email, String password) {
        this.email = email;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}
