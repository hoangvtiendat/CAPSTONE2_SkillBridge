package com.skillbridge.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    @Builder.Default
    int code = 1000;

    String message;
    T result;

    /**
     * Tạo nhanh phản hồi thành công với kết quả trả về
     */
    public static <T> ApiResponse<T> success(T result) {
        return ApiResponse.<T>builder()
                .message("SUCCESS")
                .result(result)
                .build();
    }

    /**
     * Tạo nhanh phản hồi lỗi
     */
    public static <T> ApiResponse<T> error(int code, String message) {
        return ApiResponse.<T>builder()
                .code(code)
                .message(message)
                .build();
    }

}