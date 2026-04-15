package com.skillbridge.backend.exception;

import com.skillbridge.backend.dto.response.ApiResponse;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.NoHandlerFoundException;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    // ===== CÁC LỖI HỆ THỐNG / HTTP STANDARD =====

    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<ApiResponse<?>> handleNotFound() {
        return buildResponse(ErrorCode.ENDPOINT_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse<?>> handleMethodNotAllowed() {
        return buildResponse(ErrorCode.METHOD_NOT_ALLOWED, HttpStatus.METHOD_NOT_ALLOWED);
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ApiResponse<?>> handleUnsupportedMedia() {
        return buildResponse(ErrorCode.UNSUPPORTED_MEDIA_TYPE, HttpStatus.UNSUPPORTED_MEDIA_TYPE);
    }

    // ===== LỖI LOGIC NGHIỆP VỤ (APP EXCEPTION) =====

    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponse<?>> handleAppException(AppException ex) {
        ErrorCode errorCode = ex.getErrorCode();
        log.warn("Business exception: code={}, message={}", errorCode.getCode(), errorCode.getMessage());
        return buildResponse(errorCode, errorCode.getHttpStatus());
    }

    // ===== LỖI VALIDATION (@Valid trên DTO) =====

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<?>> handlingValidation(MethodArgumentNotValidException ex) {
        String messageKey = ex.getBindingResult().getFieldError().getDefaultMessage();
        ErrorCode errorCode = ErrorCode.INVALID_KEY;

        try {
            errorCode = ErrorCode.valueOf(messageKey);
        } catch (IllegalArgumentException e) {
            // Nếu message trong @NotBlank không phải là Enum Key, trả về message thô
            return ResponseEntity.badRequest().body(ApiResponse.error(ErrorCode.INVALID_INPUT.getCode(), messageKey));
        }

        return buildResponse(errorCode, HttpStatus.BAD_REQUEST);
    }

    // ===== LỖI CONSTRAINT (@PathVariable, @RequestParam) =====

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<?>> handleConstraint(ConstraintViolationException ex) {
        String message = ex.getConstraintViolations().iterator().next().getMessage();
        return ResponseEntity.badRequest().body(ApiResponse.error(ErrorCode.INVALID_INPUT.getCode(), message));
    }

    // ===== LỖI CHƯA PHÂN LOẠI (UNCATEGORIZED) =====

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<?>> handleOther(Exception ex) {
        log.error("Uncategorized Exception: ", ex); // Dùng Slf4j thay vì printStackTrace
        return buildResponse(ErrorCode.UNCATEGORIZED_EXCEPTION, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // ================== HELPER METHODS ==================

    private ResponseEntity<ApiResponse<?>> buildResponse(ErrorCode errorCode, HttpStatus status) {
        return ResponseEntity.status(status).body(
                ApiResponse.error(errorCode.getCode(), errorCode.getMessage())
        );
    }

}