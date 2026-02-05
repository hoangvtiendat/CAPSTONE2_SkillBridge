package com.skillbridge.backend.dto.request;

import lombok.Data;

@Data
public class RegisterOtpRequest {
    String otp;
    String email;
    String password;

    public RegisterOtpRequest(String otp, String email, String password) {
        this.otp = otp;
        this.email = email;
        this.password = password;
    }
    public String getOtp() {
        return otp;
    }
    public void setOtp(String otp) {
        this.otp = otp;
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
}
