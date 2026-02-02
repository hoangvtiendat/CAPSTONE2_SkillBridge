package com.skillbridge.backend.service;

import com.skillbridge.backend.dto.request.LoginRequest;
//import com.skillbridge.backend.dto.request.LoginResponse;
import com.skillbridge.backend.dto.response.LoginResponse;
import com.skillbridge.backend.entity.User;
import com.skillbridge.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JwtService jwtService;

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));
        System.out.println("user: " + user.toString());
        boolean matches = passwordEncoder.matches(request.getPassword(), user.getPassword());
        if (!matches) {
            throw new RuntimeException("Invalid email or password");
        }
        String accessToken = jwtService.generateAccesToken(user.getId(), user.getEmail(), "admin");
        String refreshToken = jwtService.generateRefreshToken(user.getId());
        System.out.println("accessToken: " + accessToken);
        return new LoginResponse(accessToken, refreshToken);
    }
}
