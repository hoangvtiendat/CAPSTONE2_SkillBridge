package com.skillbridge.backend.controller;

import com.skillbridge.backend.dto.request.LoginRequest;
//import com.skillbridge.backend.dto.request.LoginResponse;
import com.skillbridge.backend.dto.response.LoginResponse;

import com.skillbridge.backend.entity.User;
import com.skillbridge.backend.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AuthController {
    @Autowired
    private AuthService authService;

    @PostMapping("/login")
//    User login(@RequestBody LoginRequest request) {
//        return authService.login();
//    }
    public ResponseEntity<LoginResponse> login(
            @RequestBody LoginRequest request
    ) {
        System.out.println(request);
        System.out.println("kakaka: " + ResponseEntity.ok(authService.login(request)));
        return ResponseEntity.ok(authService.login(request));
    }

}
