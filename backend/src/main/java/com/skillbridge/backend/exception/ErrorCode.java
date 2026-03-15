package com.skillbridge.backend.exception;
public enum ErrorCode {
    // ===== SYSTEM =====
    UNCATEGORIZED_EXCEPTION(9999,"Lỗi hệ thống"),
    INVALID_KEY(1001, "Invalid enum key"),
    INVALID_JSON_FORMAT(1002, "Định dạng JSON không hợp lệ"),
    INVALID_FILE_FORMAT(1010, "Định dạng file không hợp lệ. Chỉ chấp nhận .pdf, .jpg, .png"),
    JOB_NOT_FOUND(1101, "Bài đăng tuyển dụng không tồn tại hoặc đã bị xóa"),
    JOB_ALREADY_CLOSED(1102, "Bài đăng này đã đóng, không thể thao tác"),
    INVALID_JOB_STATUS(1103, "Trạng thái công việc không hợp lệ"),

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
    SKILL_NOT_FOUND(503,"Không tìm thấy kĩ năng"),
    DUPLICATE_JOB_SKILL(504, "Hiện tại kĩ năng đang được sử dụng"),
    /// Company
    EXIT_STATUS_COMPANY(601, "Hiện tại trạng thái của công ty bạn không cho phép"),
    /// Comapany_member
    MEMBER_NOT_FOUND(701,"Bạn chưa là nhân viên của công ty nào cả"),
    // Jobs
    JD_NOT_FOUND(801, "Không tìm thấy bài đăng"),
    EXITS_JD_STATUS(802,"Hiện tại bạn không thể thay đổi thông tin bài đăng"),
    EXITS_YOUR_ROLE(803, "Bạn không có đủ thẩm quyền để thực hiện chức năng này"),
    JOB_STATUS_EXITS(804,"Hiện tại JD đang được sử dụng vui lòng đăng lại khi bài đăng đóng"),
    JOB_NO_OPEN(805, "Bài tuyển dụng hiện chưa được mở"),
    JOB_NO_GREEN(806, "Bài tuyển dụng này chưa được duyệt trên hệ thống"),
    ///  ===== SUBSCRIPTTION
    // Thêm vào Enum ErrorCode của bạn
    NOT_FOUND_SUBSCRIPTION(901, "Không tìm thấy gói đăng ký"),

    // 1. Ràng buộc về Giá (Price)
    FREE_PRICE_CANNOT_BE_CHANGED(902, "Gói FREE không được phép sửa giá"),
    STANDARD_PRICE_MUST_BE_GREATER_THAN_ZERO(903, "Giá của gói STANDARD bắt buộc phải lớn hơn 0"),
    STANDARD_PRICE_EXCEEDS_PREMIUM(904, "Giá của gói STANDARD không được vượt quá gói PREMIUM"),
    PREMIUM_PRICE_LOWER_THAN_STANDARD(905, "Giá của gói PREMIUM không được bé hơn gói STANDARD"),

    // 2. Ràng buộc về Tin tuyển dụng (Job Limit)
    FREE_JOB_LIMIT_EXCEEDS_STANDARD(906, "Số lượng JD của gói FREE không được vượt quá gói STANDARD"),
    STANDARD_JOB_LIMIT_LOWER_THAN_FREE(907, "Số lượng JD của gói STANDARD không được bé hơn gói FREE"),
    STANDARD_JOB_LIMIT_EXCEEDS_PREMIUM(908, "Số lượng JD của gói STANDARD không được vượt quá gói PREMIUM"),
    PREMIUM_JOB_LIMIT_LOWER_THAN_STANDARD(909, "Số lượng JD của gói PREMIUM không được bé hơn gói STANDARD"),

    // 3. Ràng buộc về Lượt xem hồ sơ (Candidate View Limit)
    FREE_CANDIDATE_VIEW_LIMIT_EXCEEDS_STANDARD(910, "Lượt xem hồ sơ của gói FREE không được vượt quá gói STANDARD"),
    STANDARD_CANDIDATE_VIEW_LIMIT_LOWER_THAN_FREE(911, "Lượt xem hồ sơ của gói STANDARD không được bé hơn gói FREE"),
    STANDARD_CANDIDATE_VIEW_LIMIT_EXCEEDS_PREMIUM(912, "Lượt xem hồ sơ của gói STANDARD không được vượt quá gói PREMIUM"),
    PREMIUM_CANDIDATE_VIEW_LIMIT_LOWER_THAN_STANDARD(913, "Lượt xem hồ sơ của gói PREMIUM không được bé hơn gói STANDARD"),


    // 4. Ràng buộc về Hiển thị ưu tiên (Priority Display)
    FREE_HAS_PRIORITY_DISPLAY_NOT_ALLOWED(914, "Gói FREE không được phép bật hiển thị ưu tiên"),
    UNBALANCED_CUSTOM_PLAN(915,  "Tỷ lệ Job và View không cân bằng"),
    INVALID_CUSTOM_LIMITS(916, "Số lượng phải lớn hơn 0"),
    ACCESS_DENIED(917, "Bạn chỉ có thể xóa gói cước của công ty bạn"),

    //CATEGORY
    CATEGORY_EXIST(2008, "Ngành nghề này đã tồn tại"),

    //  DEGREE
    DEGREE_TYPE_REQUIRED(5001, "Loại bằng cấp là bắt buộc"),
    INVALID_DEGREE(5002, "Thông tin bằng cấp không hợp lệ"),
    INVALID_CERTIFICATE(5003, "Chứng chỉ không hợp lệ hoặc đã hết hạn"),
    INVALID_DEGREE_TYPE(5004, "Loại bằng cấp không hỗ trợ"),


    //COMPANIES
    COMPANY_EXIST(6001,"Công ty đã được đăng ký"),
    COMPANY_NOT_FOUND(6002, "Không tìm thấy công ty"),
    YOU_ARE_ADMIN(6003, "Bạn đã là ADMIN của công ty này"),
    YOU_ARE_MEMBER(6004, "Bạn đã là thành viên của công ty này"),
    HAS_NO_ADMIN(6005, "Công ty không có ADMIN nào"),
    NOT_COMPANY_MEMBER(6006, "Bạn không phải là thành viên của công ty"),
    NOT_COMPANY_ADMIN(6007, "Bạn không phải là admin của công ty"),


    //REQUEST
    REQUEST_ALREADY_SENT(7001, "Yêu cầu đã được gửi từ trước"),
    INVALID_STATUS(7002, "Trạng thái không hợp lệ"),
    JOIN_REQUEST_NOT_FOUND(7003, "Không tìm thấy yêu cầu tham gia"),
    INVALID_JOIN_REQUEST(7004, "Yêu cầu tham gia không hợp lệ"),
    JOIN_REQUEST_ALREADY_PROCESSED(7005, "Yêu cầu này đã được xử lý"),
    JSON_TO_TEXT_EXIT(7006, "lỗi biến đổi Json sang Text"),

    //JOB
    ALREADY_APPLIED(8001, "Hồ sơ ứng tuyển đã tồn tại cho bài đăng tuyển này"),

    //APPLICATION
    APPLICATION_NOT_FOUND(9001, "Không tìm thấy hồ sơ ứng tuyển")
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

