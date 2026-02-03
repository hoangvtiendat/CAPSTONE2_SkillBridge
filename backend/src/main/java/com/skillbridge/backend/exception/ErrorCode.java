package com.skillbridge.backend.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
    // ===== SYSTEM =====
    UNCATEGORIZED_EXCEPTION(9999,"Lỗi hệ thống"),
    INVALID_KEY(1001, "Invalid enum key"),

    // ===== VALIDATION =====
    EMAIL_INVALID(2001, "Email không hợp lệ"),
    REQUIRED(2002, "Không được để trống"),
    PASSWORD_INVALID(2003, "Mật khẩu không hơp lệ"),
    EMAIL_EXIST(2004, "Email đã tồn tại"),

    // ===== AUTH / SECURITY =====
    TOKEN_EXPIRED(401,"Token đã hết hạn, vui lòng đăng nhập lại"),
    UNAUTHORIZED(3001, "Bạn chưa đăng nhập"),
    FORBIDDEN(3002,"Bạn không có quyền truy cập chức năng này"),
    USER_STATUS(3003,"Tài khoản đã bị khóa"),
    USER_NOT_FOUND(3004,"Không tìm thấy ngưười dùng"),

    ;

    private int code;
    private String message;

    ErrorCode(int code, String message) {
        this.code = code;
        this.message = message;
    }

    public int getCode() {
        return code;
    }

    public void setCode(int code) {
        this.code = code;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}

