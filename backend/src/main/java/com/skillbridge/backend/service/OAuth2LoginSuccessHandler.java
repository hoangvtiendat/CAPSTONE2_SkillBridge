package com.skillbridge.backend.service;

import com.skillbridge.backend.entity.User;
import com.skillbridge.backend.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Optional;
import java.util.UUID;

@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

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

        OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();

        String email = oauthUser.getAttribute("email");
        String name = oauthUser.getAttribute("name");

        Optional<User> userOpt = userRepository.findByEmail(email);

        User user;
        if (userOpt.isPresent()) {
            user = userOpt.get();
            // Cập nhật provider nếu cần hoặc kiểm tra tính hợp lệ ở đây
            if (!"GOOGLE".equals(user.getProvider())) {
                user.setProvider("GOOGLE");
                userRepository.save(user);
            }
        } else {
            // Tạo user mới nếu chưa tồn tại
            user = new User();
            user.setId(UUID.randomUUID().toString());
            user.setEmail(email);
            user.setRole("USER");
            user.setProvider("GOOGLE");
        }

        // Sinh JWT
        String accessToken = jwtService.generateAccesToken(
                user.getId(),
                user.getEmail(),
                user.getRole()
        );

        String refreshToken = jwtService.generateRefreshToken(user.getId());
        //lấy avt của gg, nhưng chưa có trường trong db nên chưa triển khai
        String picture =  oauthUser.getAttribute("picture");
        user.setRefreshToken(refreshToken);
        userRepository.save(user);

        // Redirect về frontend kèm token
        String redirectUrl =
                "http://localhost:3000/oauth-success" +
                        "?accessToken=" + accessToken +
                        "&refreshToken=" + refreshToken;

        response.sendRedirect(redirectUrl);
    }
}
