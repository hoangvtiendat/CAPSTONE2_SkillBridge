package com.skillbridge.backend.dto.response;
import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    private int code;
    private String message;
    private T result;
    public ApiResponse(){

    }
    public ApiResponse(int httpStatus, String message, T result) {
        this.code = httpStatus;
        this.message = message;
        this.result = result;
    }
    public static <T> ApiResponse<T> success(T result) {
        return new ApiResponse<>(0, "SUCCESS", result);
    }

    // 🔥 ERROR – CÁI MÀ MÀY ĐANG THIẾU
    public static ApiResponse<?> error(int code, String message) {
        return new ApiResponse<>(code, message, null);
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

    public T getResult() {
        return result;
    }

    public void setResult(T result) {
        this.result = result;
    }
}
