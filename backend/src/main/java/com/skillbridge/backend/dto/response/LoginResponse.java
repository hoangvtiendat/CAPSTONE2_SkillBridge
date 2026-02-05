package com.skillbridge.backend.dto.response;

import com.skillbridge.backend.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
public class LoginResponse {
    //    private String accessToken;
//    private String refreshToken;
    private String is2faEnabled;
    private String accessToken;
    private String refreshToken;

    public LoginResponse(String is2faEnabled, String accessToken, String refreshToken) {
        this.is2faEnabled = is2faEnabled;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
    }

    public String getIs2faEnabled() {
        return is2faEnabled;
    }

    public void setIs2faEnabled(String is2faEnabled) {
        this.is2faEnabled = is2faEnabled;
    }
    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }
}
