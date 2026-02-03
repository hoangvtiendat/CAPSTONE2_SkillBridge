package com.skillbridge.backend.service;

import com.skillbridge.backend.dto.request.LoginRequest;
//import com.skillbridge.backend.dto.request.LoginResponse;
import com.skillbridge.backend.dto.response.LoginResponse;
import com.skillbridge.backend.entity.User;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
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
    // sử dụng preAuthorize
    // @PreAuthorize("hasRole('ADMIN')") chỉ Admin mới được dùng api
    // @PreAuthorize("hasAnyRole('USER','ADMIN')") Admin hoặc user dùng api

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));
        System.out.println("user: " + user.toString());
        if(!"ACTIVE".equals(user.getStatus())){
            throw new AppException(ErrorCode.USER_STATUS);
        }
        boolean matches = passwordEncoder.matches(request.getPassword(), user.getPassword());
        if (!matches) {
            throw new AppException(ErrorCode.PASSWORD_INVALID);
        }
        //Xử lý trường hợp nếu người dùng mở xác thực 2 lớp

        //
        String accessToken = jwtService.generateAccesToken(user.getId(), user.getEmail(), user.getRole());
        String refreshToken = jwtService.generateRefreshToken(user.getId());
        user.setRefreshToken(refreshToken);

        userRepository.save(user);

        System.out.println("accessToken: " + accessToken);
        return new LoginResponse(accessToken, refreshToken);
    }
}
