package com.skillbridge.backend.controller;

import com.skillbridge.backend.dto.request.LoginRequest;
//import com.skillbridge.backend.dto.request.LoginResponse;
import com.skillbridge.backend.dto.response.ApiResponse;
import com.skillbridge.backend.dto.response.LoginResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import com.skillbridge.backend.entity.User;
import com.skillbridge.backend.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {
    @Autowired
    private AuthService authService;

    @PostMapping("/login")
//    User login(@RequestBody LoginRequest request) {
//        return authService.login();
//    }
    public ApiResponse<LoginResponse> login(
            @RequestBody LoginRequest request
    ) {
        LoginResponse result = authService.login(request);
        ApiResponse<LoginResponse> response = new ApiResponse<>(200,"Đăng nhập thành công",result);
        System.out.println("Login request : "+request);
        System.out.println("Tình trạng login: " + ResponseEntity.ok(result));
        return response;
    }
}
