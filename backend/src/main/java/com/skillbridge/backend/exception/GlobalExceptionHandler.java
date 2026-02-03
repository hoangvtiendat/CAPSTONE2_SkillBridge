package com.skillbridge.backend.exception;
import com.skillbridge.backend.dto.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import com.skillbridge.backend.exception.ErrorCode;

@ControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponse<?>> handleAppException(AppException ex) {
        ErrorCode errorCode = ex.getErrorCode();
        ApiResponse<?> response = new ApiResponse<>();
        response.setCode(errorCode.getCode());
        response.setMessage(errorCode.getMessage());

        // Return appropriate HTTP status based on error code
        HttpStatus status = mapErrorCodeToStatus(errorCode.getCode());
        return ResponseEntity.status(status).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<?>> handleOther(Exception ex) {
        ApiResponse<?> response = new ApiResponse<>();
        response.setCode(ErrorCode.UNCATEGORIZED_EXCEPTION.getCode());
        response.setMessage(ErrorCode.UNCATEGORIZED_EXCEPTION.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

    @ExceptionHandler(value = MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<?>> handlingValidation(MethodArgumentNotValidException exception) {
        ApiResponse<?> apiResponse = new ApiResponse<>();
        String enumkey = exception.getFieldError().getDefaultMessage();
        ErrorCode errorCode = ErrorCode.INVALID_KEY;
        try {
            errorCode = ErrorCode.valueOf(enumkey);
        } catch (Exception e) {
            // Keep default error code if parsing fails
        }
        apiResponse.setCode(errorCode.getCode());
        apiResponse.setMessage(errorCode.getMessage());
        return ResponseEntity.badRequest().body(apiResponse);
    }

    private HttpStatus mapErrorCodeToStatus(int code) {
        return switch (code) {
            case 401 -> HttpStatus.UNAUTHORIZED;           // UNAUTHORIZED
            case 402 -> HttpStatus.FORBIDDEN;              // USER_STATUS (locked)
            case 403 -> HttpStatus.FORBIDDEN;              // FORBIDDEN_ROLE
            case 1002, 1004, 2001, 2002 -> HttpStatus.BAD_REQUEST;  // Email exists, password invalid, etc
            default -> HttpStatus.BAD_REQUEST;
        };
    }
}