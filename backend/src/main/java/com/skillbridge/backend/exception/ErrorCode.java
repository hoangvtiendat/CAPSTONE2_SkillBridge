package com.skillbridge.backend.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
    // ===== SYSTEM =====
    UNCATEGORIZED_EXCEPTION(9999,"Lỗi hệ thống"),
    INVALID_KEY(1001, "Invalid enum key"),
    INVALID_JSON_FORMAT(1002, "Định dạng JSON không hợp lệ"),
    INVALID_FILE_FORMAT(1010, "Định dạng file không hợp lệ. Chỉ chấp nhận .pdf, .jpg, .png"),
    // ===== HTTP =====
    ENDPOINT_NOT_FOUND(4040, "API không tồn tại"),
    METHOD_NOT_ALLOWED(4050, "Method không được hỗ trợ"),
    UNSUPPORTED_MEDIA_TYPE(4150, "Content-Type không được hỗ trợ"),
    // ===== VALIDATION =====
    EMAIL_INVALID(2001, "Email không hợp lệ"),
    REQUIRED(2002, "Không được để trống"),
    PASSWORD_INVALID(2003, "Mật khẩu không hơp lệ"),
    EMAIL_EXIST(2004, "Email đã tồn tại"),
    EMAIL_ALREADY_REGISTERED_BY_PASSWORD(2007, "Email đã được đăng ký bằng tài khoản LOCAL"),
    INVALID_OTP(2005,"Mã OTP SAI"),
    INVALID_INPUT(2006, "Dữ liệu đầu vào không hợp lệ"),
    FORBIDDEN(3002,"Bạn không có quyền truy cập chức năng này"),
    USER_STATUS(3003,"Tài khoản đã bị khóa"),
    USER_NOT_FOUND(3004,"Không tìm thấy ngưười dùng"),
    CATEGORY_NOT_FOUND(3005, "Không tìm thấy danh mục lĩnh vực"),
    CANDIDATE_NOT_FOUND(3006, "Không tìm thấy thông tin ứng viên"),
    // ===== AUTH / SECURITY =====
    TOKEN_EXPIRED(402,"Token đã hết hạn, vui lòng đăng nhập lại"),
    UNAUTHORIZED(401, "Bạn chưa đăng nhập"),
    // ===== Category/ SKilll ====
    CATEGORY_PROFESSION(501, "Tên lĩnh vữc bị trùng vui lòng đổi tên khác"),

    SKILL_EXITS_NAME(502, "Tên kỹ năng đã tồn tại trước đó"),
    SKILL_EXITS(503,"Không tìm thấy kĩ năng"),
    /// Company
    COMPANY_NOT_FOUND(601,"Không tìm thấy công ty"),
    /// Comapany_member
    MEMBER_NOT_FOUND(701,"Bạn chưa là nhân viên của công ty nào cả"),
        ///  ===== Other ======
    DEGREE_TYPE_REQUIRED(5001, "Loại bằng cấp là bắt buộc"),
    INVALID_DEGREE(5002, "Thông tin bằng cấp không hợp lệ"),
    INVALID_CERTIFICATE(5003, "Chứng chỉ không hợp lệ hoặc đã hết hạn"),
    INVALID_DEGREE_TYPE(5004, "Loại bằng cấp không hỗ trợ"),
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

