package com.skillbridge.backend.service;

import com.skillbridge.backend.dto.request.*;
//import com.skillbridge.backend.dto.request.LoginResponse;
import com.skillbridge.backend.dto.response.LoginResponse;
import com.skillbridge.backend.dto.response.RegisterResponse;
import com.skillbridge.backend.entity.InvalidatedToken;
import com.skillbridge.backend.entity.User;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.repository.InvalidatedTokenRepository;
import com.skillbridge.backend.repository.UserRepository;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Date;

@Service
public class AuthService {
    @Autowired
    private InvalidatedTokenRepository invalidatedTokenRepository;
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

    public String register(RegisterRequest request) {
        User user = new User();
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            System.out.println("email exist");
            throw new AppException(ErrorCode.EMAIL_EXIST);
        }
        System.out.println(111);

        String subject = "[SkillBridge] Mã xác thực đăng ký tài khoản";
        String otp = otpService.generateOtp(request.getEmail());
        String content =
                "<div style=\"font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 20px auto; padding: 30px; border-radius: 12px; background-color: #ffffff; border: 1px solid #e1e4e8; color: #333;\">" +
                        "    <h2 style=\"color: #1a73e8; text-align: center; margin-top: 0;\">Xác thực đăng ký tài khoản</h2>" +
                        "    <p style=\"font-size: 15px; color: #555;\">Chào bạn,</p>" +
                        "    <p style=\"font-size: 15px; color: #555; line-height: 1.6;\">Bạn đang thực hiện <b>đăng ký tài khoản</b> trên hệ thống <b>SkillBridge</b>. Vui lòng nhập mã xác thực dưới đây để hoàn tất quá trình đăng ký:</p>" +
                        "    " +
                        "    <div style=\"text-align: center; margin: 30px 0;\">" +
                        "        <span style=\"display: inline-block; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1a73e8; background: #f0f7ff; padding: 15px 30px; border-radius: 8px; border: 1px solid #1a73e8;\">" +
                        otp +
                        "        </span>" +
                        "    </div>" +
                        "    " +
                        "    <p style=\"font-size: 14px; color: #666; font-style: italic; text-align: center;\">Mã xác thực có hiệu lực trong vòng <b>180 giây</b>.</p>" +
                        "    " +
                        "    <div style=\"margin-top: 25px; padding-top: 20px; border-top: 1px solid #eee; font-size: 13px; color: #999;\">" +
                        "        <p style=\"margin: 5px 0;\">⚠️ <b>Lưu ý:</b> Vui lòng không chia sẻ mã này cho bất kỳ ai. Đội ngũ SkillBridge không bao giờ yêu cầu cung cấp mã xác thực.</p>" +
                        "        <p style=\"margin: 20px 0 0 0; font-weight: bold; color: #333;\">Trân trọng,<br>Đội ngũ SkillBridge</p>" +
                        "    </div>" +
                        "</div>";
        System.out.println(request.getEmail());
        otpService.sendOtpEmail(request.getEmail(), subject, content);
        System.out.println(2222);
        return "Mã xác thực đăng ký tài khoản đã được gửi về mail";
    }

    public RegisterResponse registerOtp(RegisterOtpRequest request) {
        if (!otpService.verifyOtp(request.getEmail(), request.getOtp())) {
            throw new AppException(ErrorCode.INVALID_OTP);
        }
        User user = new User();
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            System.out.println("email exist");
            throw new AppException(ErrorCode.EMAIL_EXIST);
        }

        String hashedPassword = passwordEncoder.encode(request.getPassword());
        user.setPassword(hashedPassword);
        user.setEmail(request.getEmail());
        user.setProvider("LOCAL");

        String accessToken = jwtService.generateAccesToken(user.getId(), user.getEmail(), user.getRole());
        String refreshToken = jwtService.generateRefreshToken(user.getId());
        user.setRefreshToken(refreshToken);
        userRepository.save(user);

        return new RegisterResponse(request.getEmail(), accessToken, refreshToken);
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

        if (user.getIs2faEnabled()) {
            System.out.println("is2faEnabled");
            String subject = "[SkillBridge] Mã xác thực đăng nhập";
            String otp = otpService.generateOtp(user.getEmail());

            String content = "<div style=\"font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 20px auto; padding: 30px; border-radius: 12px; background-color: #ffffff; border: 1px solid #e1e4e8; color: #333;\">" +
                    "    <h2 style=\"color: #1a73e8; text-align: center; margin-top: 0;\">Xác thực đăng nhập</h2>" +
                    "    <p style=\"font-size: 15px; color: #555;\">Chào bạn,</p>" +
                    "    <p style=\"font-size: 15px; color: #555; line-height: 1.6;\">Bạn đang thực hiện đăng nhập vào hệ thống <b>SkillBridge</b>. Vui lòng nhập mã xác thực dưới đây để hoàn tất:</p>" +
                    "    " +
                    "    <div style=\"text-align: center; margin: 30px 0;\">" +
                    "        <span style=\"display: inline-block; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1a73e8; background: #f0f7ff; padding: 15px 30px; border-radius: 8px; border: 1px solid #1a73e8;\">" + otp + "</span>" +
                    "    </div>" +
                    "    " +
                    "    <p style=\"font-size: 14px; color: #666; font-style: italic; text-align: center;\">Mã có hiệu lực trong vòng <b>180 giây</b>.</p>" +
                    "    " +
                    "    <div style=\"margin-top: 25px; padding-top: 20px; border-top: 1px solid #eee; font-size: 13px; color: #999;\">" +
                    "        <p style=\"margin: 5px 0;\">⚠️ <b>Lưu ý:</b> Vui lòng không chia sẻ mã này cho bất kỳ ai. Đội ngũ SkillBridge không bao giờ yêu cầu cung cấp mã này.</p>" +
                    "        <p style=\"margin: 20px 0 0 0; font-weight: bold; color: #333;\">Trân trọng,<br>Đội ngũ SkillBridge</p>" +
                    "    </div>" +
                    "</div>";
            otpService.sendOtpEmail(user.getEmail(), subject, content);

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

        String accessToken = jwtService.generateAccesToken(user.getId(), user.getEmail(), user.getRole());
        String refreshToken = jwtService.generateRefreshToken(user.getId());

        user.setRefreshToken(refreshToken);
        userRepository.save(user);

        return new LoginResponse("0", accessToken, refreshToken);
    }

    public String forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail()).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        String subject = "[SkillBridge] Mã xác thực quên mật khẩu";
        String otp = otpService.generateOtp(user.getEmail());
        String content = "<div style='font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;'>" +
                "<h2 style='color: #2D3FE0; text-align: center;'>Đặt lại mật khẩu</h2>" +
                "<p>Xin chào,</p>" +
                "<p>Chúng tôi nhận được yêu cầu khôi phục mật khẩu cho tài khoản <strong>" + user.getEmail() + "</strong> của bạn.</p>" +
                "<p style='text-align: center; margin: 30px 0;'>" +
                "<span style='font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2D3FE0; background: #f4f4f4; padding: 10px 20px; border-radius: 5px; border: 1px dashed #2D3FE0;'>" + otp + "</span>" +
                "</p>" +
                "<p>Mã này có hiệu lực trong vòng <strong>180 giây</strong>. Vui lòng không chia sẻ mã này cho bất kỳ ai để bảo mật tài khoản.</p>" +
                "<hr style='border: none; border-top: 1px solid #eee;'>" +
                "<p style='font-size: 12px; color: #888;'>Nếu bạn không yêu cầu thay đổi mật khẩu, vui lòng bỏ qua email này hoặc liên hệ bộ phận hỗ trợ của chúng tôi.</p>" +
                "<p style='font-size: 14px;'>Trân trọng,<br><strong>Đội ngũ SkillBridge</strong></p>" +
                "</div>";
        otpService.sendOtpEmail(user.getEmail(), subject, content);
        return "Mã xác thực đã được gửi về gmail của bạn";
    }

    public LoginResponse resetPassword(ResetPasswordRequest request) {
        if (!otpService.verifyOtp(request.getEmail(), request.getOtp())) {
            throw new AppException(ErrorCode.INVALID_OTP);
        }

        User user = userRepository.findByEmail(request.getEmail()).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        String hashedPassword = passwordEncoder.encode(request.getPassword());
        user.setPassword(hashedPassword);

        String accessToken = jwtService.generateAccesToken(user.getId(), user.getEmail(), user.getRole());
        String refreshToken = jwtService.generateRefreshToken(user.getId());
        user.setRefreshToken(refreshToken);
        userRepository.save(user);

        return new LoginResponse(String.valueOf(user.getIs2faEnabled()), accessToken, refreshToken);
    }

    public User getMe(String token) {
        if (token == null || token.isBlank() || !jwtService.validateToken(token)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        String userId;
        try {
            userId = jwtService.getUserId(token);
            System.out.println("userId = " + userId);
        } catch (Exception e) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        User user = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        System.out.println("user = " + user);

        return user;
    }

    public User toggleTwoFactor(boolean is2faEnabled, String token) {
        if (token == null || token.isBlank() || !jwtService.validateToken(token)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        String userId;
        try {
            userId = jwtService.getUserId(token);
            System.out.println("userId = " + userId);
        } catch (Exception e) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        System.out.println("is2faEnabled = " + is2faEnabled);
        User user = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        user.setIs2faEnabled(is2faEnabled);
        return userRepository.save(user);

    }

    public void logout(String jwt) {

        try {
            // 2. Trích xuất thông tin từ token thông qua JwtService
            Claims claims = jwtService.extractClaims(jwt);
            String jti = claims.getId(); // Lấy ID duy nhất của token
            Date expiryTime = claims.getExpiration();
            String userId = claims.getSubject();

            // 3. Đưa Access Token vào danh sách đen (Blacklist)
            InvalidatedToken invalidatedToken = new InvalidatedToken();
            invalidatedToken.setId(jti);
            invalidatedToken.setExpiryTime(expiryTime);
            invalidatedTokenRepository.save(invalidatedToken);

            // 4. Vô hiệu hóa Refresh Token trong Database của User
            userRepository.findById(userId).ifPresent(user -> {
                user.setRefreshToken(null);
                userRepository.save(user);
            });

            System.out.println("[LOGOUT] User ID: " + userId + " đã logout thành công.");

        } catch (AppException e) {
            // Nếu token đã hết hạn sẵn (TOKEN_EXPIRED), coi như đã logout xong
            if (e.getErrorCode() == ErrorCode.TOKEN_EXPIRED) {
                return;
            }
            throw e;
        }
    }
}
