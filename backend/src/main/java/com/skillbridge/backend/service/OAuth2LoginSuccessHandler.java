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

            Optional<User> userOptional = userRepository.findByEmail(email);
            User user;

            if (userOptional.isPresent()) {
                user = userOptional.get();
            } else {
                // 2. Nếu là user mới, tạo object và LƯU NGAY để lấy ID
                user = new User();
                user.setEmail(email);
                user.setName(name);
                user.setRole("USER"); // Hoặc CANDIDATE tùy bạn
                user.setProvider("GOOGLE");
                user = userRepository.saveAndFlush(user); // Dùng saveAndFlush để có ID ngay lập tức
            }

            // 3. Kiểm tra provider (như cũ)
            if (!"GOOGLE".equals(user.getProvider())) {
                // ... redirect báo lỗi email đã đăng ký bằng password ...
                return;
            }

            // 4. BÂY GIỜ user.getId() CHẮC CHẮN ĐÃ CÓ GIÁ TRỊ (vì đã được save ở trên)
            String accessToken = jwtService.generateAccesToken(
                    user.getId(),
                    user.getEmail(),
                    user.getRole()
            );

            String refreshToken = jwtService.generateRefreshToken(user.getId());

            // 5. Cập nhật refreshToken và lưu lại lần nữa
            user.setRefreshToken(refreshToken);
            userRepository.save(user);

            // 6. Redirect (như cũ)
            String redirectUrl = "http://localhost:3000/oauth-success" +
                    "?accessToken=" + accessToken +
                    "&refreshToken=" + refreshToken;

            response.sendRedirect(redirectUrl);
        } catch (Exception e) {
            e.printStackTrace();
            response.sendError(500, "OAuth2 login failed");
        }

    }
}
