package com.skillbridge.backend.dto.request;

import lombok.Data;

@Data
public class ForgotPasswordRequest {
    String email;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}
