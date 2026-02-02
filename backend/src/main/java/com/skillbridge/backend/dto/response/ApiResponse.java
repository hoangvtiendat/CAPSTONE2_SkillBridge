package com.skillbridge.backend.dto.response;
import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    private int httpStatus;
    private String message;
    private T result;
    public ApiResponse(){

    }
    public ApiResponse(int httpStatus, String message, T result) {
        this.httpStatus = httpStatus;
        this.message = message;
        this.result = result;
    }

    public int getHttpStatus() {
        return httpStatus;
    }

    public void setHttpStatus(int httpStatus) {
        this.httpStatus = httpStatus;
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
