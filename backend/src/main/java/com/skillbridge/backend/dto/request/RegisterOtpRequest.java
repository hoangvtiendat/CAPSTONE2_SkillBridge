package com.skillbridge.backend.dto.request;

import lombok.Data;

@Data
public class RegisterOtpRequest {
    String otp;
    String email;
    String password;
    String name;
    String phoneNumber;
    String address;

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
    public String getName() {

        return name;
    }
    public void setName(String name) {
        this.name = name;
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
}
