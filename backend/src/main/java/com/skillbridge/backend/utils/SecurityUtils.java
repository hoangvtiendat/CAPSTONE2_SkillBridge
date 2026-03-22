package com.skillbridge.backend.utils;

import com.skillbridge.backend.config.CustomUserDetails;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class SecurityUtils {

    /**
     * Hàm để lấy User đang đăng nhập.
     * Quăng lỗi ngay nếu chưa đăng nhập hoặc token sai.
     */
    public CustomUserDetails getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null &&
                authentication.isAuthenticated() &&
                authentication.getPrincipal() instanceof CustomUserDetails userDetails) {
            return userDetails;
        }

        throw new AppException(ErrorCode.UNAUTHORIZED);
    }

    /**
     * nếu không có thì trả về null (Dùng cho xem Job Detail)
     */
    public CustomUserDetails getCurrentUserOptional() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null &&
                authentication.isAuthenticated() &&
                authentication.getPrincipal() instanceof CustomUserDetails userDetails) {
            return userDetails;
        }
        return null;
    }

    /**
     * Lấy UserId nhanh
     */
    public String getCurrentUserId() {
        return getCurrentUser().getUserId();
    }
}