package com.skillbridge.backend.service;

import com.skillbridge.backend.dto.response.RegisterResponse;
import com.skillbridge.backend.entity.User;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.io.IOException;
import java.util.Optional;
import java.util.UUID;

@Component
public class OAuth2LoginSuccessHandler
        implements AuthenticationSuccessHandler {

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final AuthService authService;

    public OAuth2LoginSuccessHandler(
            JwtService jwtService,
            UserRepository userRepository,
            AuthService authService
    ) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.authService = authService;
    }


    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException {
        try {
            OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();
            String email = oauthUser.getAttribute("email");
            String name = oauthUser.getAttribute("name");

            // GỌI SERVICE Ở ĐÂY ĐỂ ĐỒNG NHẤT LOGIC
            RegisterResponse rs = authService.registerGoogle(email, name);

            String redirectUrl = "http://localhost:3000/oauth-success" +
                    "?accessToken=" + rs.getAccessToken() +
                    "&refreshToken=" + rs.getRefreshToken();
            response.sendRedirect(redirectUrl);
        } catch (Exception e) {
            e.printStackTrace();
            response.sendError(500, "OAuth2 login failed");
        }

    }
}
