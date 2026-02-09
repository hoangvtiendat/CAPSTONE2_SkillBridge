package com.skillbridge.backend.exception;

import com.skillbridge.backend.dto.response.ApiResponse;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.NoHandlerFoundException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // ===== 404 API NOT FOUND =====
    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<ApiResponse<?>> handleNotFound(NoHandlerFoundException ex) {
        return buildResponse(ErrorCode.ENDPOINT_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    // ===== 405 METHOD NOT ALLOWED =====
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse<?>> handleMethodNotAllowed(HttpRequestMethodNotSupportedException ex) {
        return buildResponse(ErrorCode.METHOD_NOT_ALLOWED, HttpStatus.METHOD_NOT_ALLOWED);
    }

    // ===== 415 UNSUPPORTED MEDIA TYPE =====
    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ApiResponse<?>> handleUnsupportedMedia(HttpMediaTypeNotSupportedException ex) {
        return buildResponse(ErrorCode.UNSUPPORTED_MEDIA_TYPE, HttpStatus.UNSUPPORTED_MEDIA_TYPE);
    }

    // ===== BUSINESS EXCEPTION =====
    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponse<?>> handleAppException(AppException ex) {ErrorCode errorCode = ex.getErrorCode();
        return buildResponse(errorCode, mapErrorCodeToStatus(errorCode));
    }

    // ===== VALIDATION =====
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<?>> handlingValidation(MethodArgumentNotValidException ex) {
        ErrorCode errorCode = parseEnum(ex);
        return buildResponse(errorCode, HttpStatus.BAD_REQUEST);
    }

    // ===== SYSTEM ERROR =====
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<?>> handleOther(Exception ex) {
        ex.printStackTrace();
        return buildResponse(
                ErrorCode.UNCATEGORIZED_EXCEPTION,
                HttpStatus.INTERNAL_SERVER_ERROR
        );
    }

    // ================== PRIVATE METHODS ==================

    private ResponseEntity<ApiResponse<?>> buildResponse(ErrorCode errorCode, HttpStatus status) {
        ApiResponse<?> response = new ApiResponse<>();
        response.setCode(errorCode.getCode());
        response.setMessage(errorCode.getMessage());
        return ResponseEntity.status(status).body(response);
    }

    private HttpStatus mapErrorCodeToStatus(ErrorCode errorCode) {
        return switch (errorCode) {
            case TOKEN_EXPIRED, UNAUTHORIZED -> HttpStatus.UNAUTHORIZED;
            case FORBIDDEN, USER_STATUS -> HttpStatus.FORBIDDEN;
            case EMAIL_INVALID, PASSWORD_INVALID, REQUIRED,
                 EMAIL_EXIST, INVALID_OTP -> HttpStatus.BAD_REQUEST;
            case USER_NOT_FOUND -> HttpStatus.NOT_FOUND;
            default -> HttpStatus.BAD_REQUEST;
        };
    }

    /**
     * Parse enum key from @Valid message
     */
    private ErrorCode parseEnum(MethodArgumentNotValidException ex) {
        if (ex.getFieldError() == null) {
            return ErrorCode.INVALID_KEY;
        }

        String enumKey = ex.getFieldError().getDefaultMessage();
        try {
            return ErrorCode.valueOf(enumKey);
        } catch (IllegalArgumentException e) {
            return ErrorCode.INVALID_KEY;
        }
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<?>> handleConstraint(
            ConstraintViolationException ex) {

        String message = ex.getConstraintViolations()
                .iterator()
                .next()
                .getMessage();

        return ResponseEntity.badRequest().body(
                ApiResponse.error(
                        ErrorCode.INVALID_INPUT.getCode(),
                        message
                )
        );
    }
}
