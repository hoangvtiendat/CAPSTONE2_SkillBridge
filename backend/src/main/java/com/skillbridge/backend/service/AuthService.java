package com.skillbridge.backend.service;

import com.skillbridge.backend.dto.request.LoginRequest;
//import com.skillbridge.backend.dto.request.LoginResponse;
import com.skillbridge.backend.dto.request.RegisterRequest;
import com.skillbridge.backend.dto.response.LoginResponse;
import com.skillbridge.backend.dto.response.RegisterResponse;
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
    private OtpService otpService;

    @Autowired
    private JwtService jwtService;
    // sử dụng preAuthorize
    // @PreAuthorize("hasRole('ADMIN')") chỉ Admin mới được dùng api
    // @PreAuthorize("hasAnyRole('USER','ADMIN')") Admin hoặc user dùng api

    public RegisterResponse register(RegisterRequest request) {
        User user = new User();
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            System.out.println("email exist");
            throw new AppException(ErrorCode.EMAIL_EXIST);
        }
        String hashedPassword = passwordEncoder.encode(request.getPassword());
        user.setPassword(hashedPassword);
        user.setEmail(request.getEmail());

        userRepository.save(user);

        String accessToken = jwtService.generateAccesToken(user.getId(), user.getEmail(), user.getRole());
        String refreshToken = jwtService.generateRefreshToken(user.getId());
        user.setRefreshToken(refreshToken);

        return new RegisterResponse(request.getEmail(), hashedPassword, accessToken, refreshToken);

    }

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        System.out.println("user: " + user.toString());
        if (!"ACTIVE".equals(user.getStatus())) {
            throw new AppException(ErrorCode.USER_STATUS);
        }
        boolean matches = passwordEncoder.matches(request.getPassword(), user.getPassword());
        if (!matches) {
            throw new AppException(ErrorCode.PASSWORD_INVALID);
        }
        //Xử lý trường hợp nếu người dùng mở xác thực 2 lớp
        if (user.isIs2faEnabled()) {
            otpService.sendOtpEmail(user.getEmail());

            return new LoginResponse("1", null, null);
        }
        //
        return issueToken(user);
    }
    public LoginResponse verifyOtp(LoginRequest request) {

        boolean valid = otpService.verifyOtp(
                request.getEmail(),
                request.getOtp()
        );

        if (!valid) {
            throw new AppException(ErrorCode.INVALID_OTP);
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHORIZED));

        return issueToken(user);
    }
    private LoginResponse issueToken(User user) {

        String accessToken = jwtService.generateAccesToken(user.getId(),user.getEmail(),user.getRole());
        String refreshToken = jwtService.generateRefreshToken(user.getId());

        user.setRefreshToken(refreshToken);
        userRepository.save(user);

        return new LoginResponse("0", accessToken, refreshToken);
    }
}
