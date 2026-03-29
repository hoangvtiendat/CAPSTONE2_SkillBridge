package com.skillbridge.backend.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum ErrorCode {
    // 1xxx: SYSTEM & GENERAL
    UNCATEGORIZED_EXCEPTION(1000, "Lỗi hệ thống không xác định", HttpStatus.INTERNAL_SERVER_ERROR),
    INTERNAL_SERVER_ERROR(1001, "Internal server error", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1002, "Key cấu hình không hợp lệ", HttpStatus.BAD_REQUEST),
    INVALID_JSON_FORMAT(1003, "Định dạng dữ liệu JSON không hợp lệ", HttpStatus.BAD_REQUEST),
    INVALID_INPUT(1004, "Dữ liệu đầu vào không hợp lệ", HttpStatus.BAD_REQUEST),
    INVALID_FILE_FORMAT(1005, "Định dạng file không hợp lệ (Chỉ nhận .pdf, .jpg, .png)", HttpStatus.UNSUPPORTED_MEDIA_TYPE),
    JSON_PROCESSING_ERROR(1006, "Lỗi xử lý chuyển đổi dữ liệu JSON", HttpStatus.INTERNAL_SERVER_ERROR),
    FIELD_REQUIRED(1007, "Trường dữ liệu này là bắt buộc", HttpStatus.BAD_REQUEST),
    TEMPERATURE_INVALID(1008, "Giá trị Temperature phải nằm trong khoảng từ 0.0 đến 1.0", HttpStatus.BAD_REQUEST),
    ENDPOINT_NOT_FOUND(1009, "Đường dẫn API không tồn tại", HttpStatus.NOT_FOUND),
    METHOD_NOT_ALLOWED(1010, "Phương thức HTTP không được hỗ trợ", HttpStatus.METHOD_NOT_ALLOWED),
    UNSUPPORTED_MEDIA_TYPE(1011, "Định dạng dữ liệu truyền vào không hỗ trợ", HttpStatus.UNSUPPORTED_MEDIA_TYPE),
    INVALID_STATUS(1012, "Trạng thái không hợp lệ", HttpStatus.BAD_REQUEST),
    ACCESS_DENIED(1013, "Truy cập bị từ chối, bạn không có quyền thực hiện hành động này", HttpStatus.FORBIDDEN),
    LOG_NOT_FOUND(1014, "Không tìm thấy log", HttpStatus.NOT_FOUND),
    AI_EXITS(1015,"Chức năng liên quan đến AI đang bị lỗi", HttpStatus.INTERNAL_SERVER_ERROR),
    // 2xxx: AUTH & SECURITY
    UNAUTHORIZED(2000, "Bạn chưa đăng nhập hoặc phiên làm việc hết hạn", HttpStatus.UNAUTHORIZED),
    FORBIDDEN(2001, "Bạn không có quyền truy cập chức năng này", HttpStatus.FORBIDDEN),
    TOKEN_EXPIRED(2002, "Token đã hết hạn, vui lòng đăng nhập lại", HttpStatus.UNAUTHORIZED),
    EMAIL_INVALID(2003, "Email không đúng định dạng", HttpStatus.BAD_REQUEST),
    PASSWORD_INVALID(2004, "Mật khẩu không đủ mạnh hoặc không đúng", HttpStatus.BAD_REQUEST),
    EMAIL_EXIST(2005, "Email này đã tồn tại trên hệ thống", HttpStatus.BAD_REQUEST),
    EMAIL_ALREADY_REGISTERED_BY_PASSWORD(2006, "Email này đã được đăng ký bằng mật khẩu, vui lòng không dùng mạng xã hội", HttpStatus.BAD_REQUEST),
    INVALID_OTP(2007, "Mã xác thực (OTP) không chính xác", HttpStatus.BAD_REQUEST),

    // 3xxx: USER & CANDIDATE
    USER_NOT_FOUND(3000, "Không tìm thấy người dùng", HttpStatus.NOT_FOUND),
    USER_STATUS_LOCKED(3001, "Tài khoản của bạn hiện đang bị khóa", HttpStatus.FORBIDDEN),
    CANDIDATE_NOT_FOUND(3002, "Không tìm thấy thông tin ứng viên", HttpStatus.NOT_FOUND),
    DEGREE_TYPE_REQUIRED(3003, "Loại bằng cấp là bắt buộc", HttpStatus.BAD_REQUEST),
    INVALID_DEGREE_INFO(3004, "Thông tin bằng cấp hoặc chứng chỉ không hợp lệ", HttpStatus.BAD_REQUEST),
    USER_STATUS(3005, "Trạng thái người dùng không hợp lệ", HttpStatus.BAD_REQUEST),
    INVALID_CERTIFICATE_INFO(3007, "Thông tin chứng chỉ không hợp lệ", HttpStatus.BAD_REQUEST),
    INVALID_DEGREE_TYPE(3008, "Loại bằng cấp không được hệ thống hỗ trợ", HttpStatus.BAD_REQUEST),
    PHONE_INVALID(3009, "Số điện thoại không hợp lệ (Phải có 10 số, bắt đầu bằng 0 hoặc +84)", HttpStatus.BAD_REQUEST),
    APPLICATION_ALREADY_EXISTS(3010, "Bạn đã nộp đơn cho công việc này rồi", HttpStatus.BAD_REQUEST),
    OCR_FAILED(3011,"Lỗi ocr không thể đọc được dữ liệu",HttpStatus.BAD_REQUEST),
    // 4xxx: COMPANY & MEMBERSHIP
    COMPANY_NOT_FOUND(4000, "Mã số thuế chưa tồn tại. Vui lòng đăng ký mới!", HttpStatus.NOT_FOUND),
    COMPANY_EXIST(4001, "Công ty này đã được đăng ký trên hệ thống", HttpStatus.BAD_REQUEST),
    NOT_COMPANY_MEMBER(4002, "Bạn không phải là thành viên của công ty này", HttpStatus.FORBIDDEN),
    NOT_COMPANY_ADMIN(4003, "Bạn không có quyền Admin của công ty", HttpStatus.FORBIDDEN),
    YOU_ARE_ALREADY_MEMBER(4004, "Bạn đã là thành viên hoặc Admin của công ty này", HttpStatus.BAD_REQUEST),
    COMPANY_STATUS_INVALID(4005, "Trạng thái công ty hiện tại không cho phép thực hiện thao tác này", HttpStatus.BAD_REQUEST),
    MEMBER_NOT_FOUND(4006, "Bạn chưa tham gia vào công ty nào", HttpStatus.NOT_FOUND),
    JOIN_REQUEST_NOT_FOUND(4007, "Không tìm thấy yêu cầu tham gia công ty", HttpStatus.NOT_FOUND),
    REQUEST_ALREADY_SENT(4008, "Bạn đã gửi yêu cầu tham gia trước đó rồi", HttpStatus.BAD_REQUEST),
    COMPANY_DEACTIVATED(4009, "Công ty đã bị vô hiệu hóa", HttpStatus.FORBIDDEN),
    INVALID_CONFIRMATION_CODE(4010, "Mã xác nhận không chính xác", HttpStatus.BAD_REQUEST),
    COMPANY_ALREADY_DEACTIVATED(4011, "Công ty này đã ngừng hoạt động từ trước", HttpStatus.BAD_REQUEST),
    JOIN_REQUEST_ALREADY_PROCESSED(4012, "Yêu cầu tham gia này đã được xử lý", HttpStatus.BAD_REQUEST),
    HAS_NO_ADMIN(4013, "Công ty hiện không có quản trị viên", HttpStatus.BAD_REQUEST),
    YOU_ARE_MEMBER(4014, "Bạn đã là thành viên của công ty này", HttpStatus.BAD_REQUEST),
    YOU_ARE_ADMIN(4015, "Bạn đang là quản trị viên của công ty này", HttpStatus.BAD_REQUEST),
    EXITS_YOUR_ROLE(4016, "Bạn đã sở hữu vai trò này rồi", HttpStatus.BAD_REQUEST),
    EXIT_STATUS_COMPANY(4017, "Trạng thái công ty này đã tồn tại", HttpStatus.BAD_REQUEST),
    COMPANY_DEACTIVATED_MEMBER(4018, "Tài khoản của bạn thuộc một công ty đã bị vô hiệu hóa", HttpStatus.FORBIDDEN),

    // 5xxx: JOB & SKILL & CATEGORY
    JOB_NOT_FOUND(5000, "Bài đăng tuyển dụng không tồn tại hoặc đã bị xóa", HttpStatus.NOT_FOUND),
    JOB_ALREADY_CLOSED(5001, "Bài đăng này đã đóng, không thể thao tác", HttpStatus.BAD_REQUEST),
    INVALID_JOB_STATUS(5002, "Trạng thái tin tuyển dụng không hợp lệ", HttpStatus.BAD_REQUEST),
    CATEGORY_NOT_FOUND(5003, "Không tìm thấy danh mục/lĩnh vực này", HttpStatus.NOT_FOUND),
    CATEGORY_EXIST(5004, "Tên lĩnh vực/ngành nghề này đã tồn tại", HttpStatus.BAD_REQUEST),
    SKILL_NOT_FOUND(5005, "Không tìm thấy kỹ năng yêu cầu", HttpStatus.NOT_FOUND),
    SKILL_EXIST(5006, "Kỹ năng này đã tồn tại trong hồ sơ", HttpStatus.BAD_REQUEST),
    DUPLICATE_JOB_SKILL(5007, "Kỹ năng này đang được sử dụng, không thể xóa", HttpStatus.BAD_REQUEST),
    JOB_NOT_APPROVED(5008, "Bài tuyển dụng này chưa được duyệt trên hệ thống", HttpStatus.FORBIDDEN),
    SKILL_NAME_REQUIRED(5009, "Tên kỹ năng không được để trống", HttpStatus.BAD_REQUEST),
    JOB_NO_GREEN(5010, "Bài đăng này không đủ điều kiện (Green Check)", HttpStatus.BAD_REQUEST),
    JOB_STATUS_EXITS(5011, "Trạng thái này đã tồn tại cho bài tuyển dụng", HttpStatus.BAD_REQUEST),
    SKILL_EXITS_NAME(5012, "Tên kỹ năng này đã tồn tại trên hệ thống", HttpStatus.BAD_REQUEST),
    CATEGORY_PROFESSION(5013, "Danh mục ngành nghề chuyên môn không hợp lệ hoặc đã tồn tại", HttpStatus.BAD_REQUEST),

    // 6xxx: SUBSCRIPTION & PAYMENT (TIER LOGIC)
    SUBSCRIPTION_NOT_FOUND(6000, "Không tìm thấy gói đăng ký của công ty", HttpStatus.NOT_FOUND),
    SUBSCRIPTION_EXPIRED_OR_OUT(6001, "Gói dịch vụ đã hết hạn hoặc hết lượt sử dụng", HttpStatus.PAYMENT_REQUIRED),
    PAYMENT_PROVIDER_ERROR(6002, "Không nhận được phản hồi từ đối tác thanh toán", HttpStatus.BAD_GATEWAY),
    PRICE_STRATEGY_INVALID(6003, "Ràng buộc về giá giữa các gói cước không hợp lệ", HttpStatus.BAD_REQUEST),
    LIMIT_STRATEGY_INVALID(6004, "Ràng buộc về số lượng giữa các gói không hợp lệ", HttpStatus.BAD_REQUEST),
    INVALID_CUSTOM_LIMITS(6005, "Số lượng giới hạn phải lớn hơn 0", HttpStatus.BAD_REQUEST),
    PRICE_CANNOT_BE_NEGATIVE(6006, "Giá gói cước không được là số âm", HttpStatus.BAD_REQUEST),
    FREE_PLAN_LIMITATION(6007, "Gói FREE không được phép thay đổi cấu hình nâng cao", HttpStatus.FORBIDDEN),
    PAYMENT_AMOUNT_TOO_LOW(6008, "Số tiền thanh toán tối thiểu là 1,000 VNĐ", HttpStatus.BAD_REQUEST),
    PAYMENT_FAILED(6009, "Giao dịch thất bại, vui lòng thử lại sau", HttpStatus.PAYMENT_REQUIRED),
    INVALID_PAYMENT_METHOD(6010, "Phương thức thanh toán không được hỗ trợ", HttpStatus.BAD_REQUEST),
    LIMIT_EXCEEDS_NEXT_TIER(6011, "Giới hạn của gói không được vượt quá gói cấp cao hơn", HttpStatus.BAD_REQUEST),
    SUBSCRIPTION_OF_COMPANY(6012, "Công ty hiện đã có gói đăng ký còn hiệu lực", HttpStatus.BAD_REQUEST),
    EXIT_SUBSCRIPTION(6013, "Gói đăng ký đã hết hạn", HttpStatus.BAD_REQUEST),
    CHECK_STATUS_SUB(6014, "Vui lòng kiểm tra lại trạng thái gói đăng ký", HttpStatus.BAD_REQUEST),
    NOT_FOUND_SUBSCRIPTION(6015, "Không tìm thấy thông tin gói dịch vụ này", HttpStatus.NOT_FOUND),
    FREE_PRICE_CANNOT_BE_CHANGED(6016, "Giá gói FREE là mặc định, không thể thay đổi", HttpStatus.BAD_REQUEST),
    FREE_HAS_PRIORITY_DISPLAY_NOT_ALLOWED(6017, "Gói FREE không được phép bật tính năng ưu tiên hiển thị", HttpStatus.BAD_REQUEST),
    FREE_JOB_LIMIT_EXCEEDS_STANDARD(6018, "Giới hạn tin của gói FREE không được vượt quá gói STANDARD", HttpStatus.BAD_REQUEST),
    FREE_CANDIDATE_VIEW_LIMIT_EXCEEDS_STANDARD(6019, "Giới hạn xem ứng viên gói FREE không được vượt quá gói STANDARD", HttpStatus.BAD_REQUEST),
    STANDARD_PRICE_MUST_BE_GREATER_THAN_ZERO(6020, "Giá gói STANDARD phải lớn hơn gói FREE", HttpStatus.BAD_REQUEST),
    STANDARD_PRICE_EXCEEDS_PREMIUM(6021, "Giá của gói STANDARD không được vượt quá gói PREMIUM", HttpStatus.BAD_REQUEST),
    STANDARD_JOB_LIMIT_LOWER_THAN_FREE(6022, "Giới hạn tin gói STANDARD phải lớn hơn hoặc bằng gói FREE", HttpStatus.BAD_REQUEST),
    STANDARD_JOB_LIMIT_EXCEEDS_PREMIUM(6023, "Giới hạn tin gói STANDARD không được vượt quá gói PREMIUM", HttpStatus.BAD_REQUEST),
    STANDARD_CANDIDATE_VIEW_LIMIT_LOWER_THAN_FREE(6024, "Giới hạn xem của gói STANDARD phải lớn hơn gói FREE", HttpStatus.BAD_REQUEST),
    STANDARD_CANDIDATE_VIEW_LIMIT_EXCEEDS_PREMIUM(6025, "Giới hạn xem của gói STANDARD không được vượt quá gói PREMIUM", HttpStatus.BAD_REQUEST),
    PREMIUM_PRICE_LOWER_THAN_STANDARD(6026, "Giá gói PREMIUM phải cao hơn gói STANDARD", HttpStatus.BAD_REQUEST),
    PREMIUM_JOB_LIMIT_LOWER_THAN_STANDARD(6027, "Giới hạn tin gói PREMIUM phải cao hơn gói STANDARD", HttpStatus.BAD_REQUEST),
    PREMIUM_CANDIDATE_VIEW_LIMIT_LOWER_THAN_STANDARD(6028, "Giới hạn xem gói PREMIUM phải cao nhất hệ thống", HttpStatus.BAD_REQUEST),
    NOT_FOUND_SUBSCRIPTION_PRENIUM(6029, "Không tìm thấy thông tin gói PREMIUM trong hệ thống", HttpStatus.NOT_FOUND),
    UNBALANCED_CUSTOM_PLAN(6030, "Cấu hình gói tùy chỉnh không cân bằng so với các gói mặc định", HttpStatus.BAD_REQUEST),

    // 7xxx: APPLICATION
    APPLICATION_NOT_FOUND(7000, "Không tìm thấy hồ sơ ứng tuyển", HttpStatus.NOT_FOUND),
    ALREADY_APPLIED(7001, "Bạn đã ứng tuyển vào vị trí này trước đó rồi", HttpStatus.BAD_REQUEST),
    // 8xxx: AI
    AI_PARSING_FAILED(8001, "Không thể phân tích được CV của chức năng parsingCV", HttpStatus.BAD_REQUEST),;
    private final int code;
    private final String message;
    private final HttpStatus httpStatus;
}