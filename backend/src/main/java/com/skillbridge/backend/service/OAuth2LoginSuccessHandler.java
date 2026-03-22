package com.skillbridge.backend.service;

import com.skillbridge.backend.dto.response.RegisterResponse;
import com.skillbridge.backend.exception.AppException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    @Value("${app.frontend-url:http://localhost:3000}")
    String frontendUrl;

    final AuthService authService;
    final SystemLogService systemLog;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException {
        try {
            // 1. Lấy thông tin từ Google
            OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();
            String email = oauthUser.getAttribute("email");
            String name = oauthUser.getAttribute("name");
            String picture = oauthUser.getAttribute("picture");

            log.info("OAuth2 login successful for email: {}", email);

            // 2. Đăng ký hoặc Đăng nhập thông qua AuthService
            RegisterResponse rs = authService.registerGoogle(email, name);

            // 3. Ghi log hệ thống (null vì chưa có SecurityContext ổn định tại thời điểm callback)
            systemLog.info(null, "Người dùng " + email + " đăng nhập thành công qua Google");

            // 4. Xây dựng Redirect URL an toàn bằng UriComponentsBuilder
            String targetUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/oauth-success")
                    .queryParam("accessToken", rs.getAccessToken())
                    .queryParam("refreshToken", rs.getRefreshToken())
                    .queryParam("status", "success")
                    .build().toUriString();

            response.sendRedirect(targetUrl);

        } catch (AppException e) {
            log.error("Business error during OAuth2 login: {}", e.getErrorCode().getMessage());
            redirectWithError(response, "auth_error");
        } catch (Exception e) {
            log.error("Critical error during OAuth2 login: ", e);
            redirectWithError(response, "internal_error");
        }
    }

    /**
     * Điều hướng về Frontend kèm mã lỗi để hiển thị thông báo cho người dùng
     */
    private void redirectWithError(HttpServletResponse response, String errorType) throws IOException {
        String errorUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/login")
                .queryParam("error", errorType)
                .build().toUriString();
        response.sendRedirect(errorUrl);
    }
}