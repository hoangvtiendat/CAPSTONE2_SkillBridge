package com.skillbridge.backend.service;

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

    public OAuth2LoginSuccessHandler(
            JwtService jwtService,
            UserRepository userRepository
    ) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
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
            String picture = oauthUser.getAttribute("picture");

            User user = userRepository.findByEmail(email)
                    .orElseGet(() -> {
                        User newUser = new User();
                        newUser.setEmail(email);
                        newUser.setName(name);
                        newUser.setRole("USER");
                        newUser.setProvider("GOOGLE");
                        return newUser;
                    });

            // Email đã tồn tại nhưng không phải Google
            if (!"GOOGLE".equals(user.getProvider())) {
                try {
                    String message = "Email này đã được đăng ký bằng mật khẩu. Vui lòng đăng nhập thủ công!";

                    String encodedMessage = URLEncoder.encode(message, StandardCharsets.UTF_8.toString());


                    String targetUrl = "http://localhost:3000/login?error=true&message=" + encodedMessage;

                    response.sendRedirect(targetUrl);

                    return;
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
            // Sinh JWT
            String accessToken = jwtService.generateAccesToken(
                    user.getId(),
                    user.getEmail(),
                    user.getRole()
            );

            String refreshToken =
                    jwtService.generateRefreshToken(user.getId());

            user.setRefreshToken(refreshToken);
            userRepository.save(user);

            String redirectUrl =
                    "http://localhost:3000/oauth-success" +
                            "?accessToken=" + accessToken +
                            "&refreshToken=" + refreshToken;

            response.sendRedirect(redirectUrl);
        } catch (Exception e) {
            e.printStackTrace();
            response.sendError(500, "OAuth2 login failed");
        }

    }
}
