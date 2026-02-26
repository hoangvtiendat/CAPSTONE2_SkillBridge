package com.skillbridge.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;

public class UserResponse {
    @JsonProperty("id")
    private String id;
    
    @JsonProperty("name")
    private String name;
    
    @JsonProperty("email")
    private String email;
    
    @JsonProperty("phoneNumber")
    private String phoneNumber;
    
    @JsonProperty("address")
    private String address;
    
    @JsonProperty("role")
    private String role;
    
    @JsonProperty("status")
    private String status;
    
    @JsonProperty("is2faEnabled")
    private String is2faEnabled;
    
    @JsonProperty("createdAt")
    private LocalDateTime createdAt;

    public UserResponse() {}

    public UserResponse(String id, String name, String email, String phoneNumber, String address, String role, String status, String is2faEnabled, LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.address = address;
        this.role = role;
        this.status = status;
        this.is2faEnabled = is2faEnabled;
        this.createdAt = createdAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getIs2faEnabled() { return is2faEnabled; }
    public void setIs2faEnabled(String is2faEnabled) { this.is2faEnabled = is2faEnabled; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String id;
        private String name;
        private String email;
        private String phoneNumber;
        private String address;
        private String role;
        private String status;
        private String is2faEnabled;
        private LocalDateTime createdAt;

        public Builder id(String id) { this.id = id; return this; }
        public Builder name(String name) { this.name = name; return this; }
        public Builder email(String email) { this.email = email; return this; }
        public Builder phoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; return this; }
        public Builder address(String address) { this.address = address; return this; }
        public Builder role(String role) { this.role = role; return this; }
        public Builder status(String status) { this.status = status; return this; }
        public Builder is2faEnabled(String is2faEnabled) { this.is2faEnabled = is2faEnabled; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public UserResponse build() {
            return new UserResponse(id, name, email, phoneNumber, address, role, status, is2faEnabled, createdAt);
        }
    }
}
