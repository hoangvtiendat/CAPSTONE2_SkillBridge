package com.skillbridge.backend.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@RequiredArgsConstructor
public class AppException extends RuntimeException {

    private final ErrorCode errorCode;
    @Override
    public String getMessage() {
        return errorCode.getMessage();
    }
}