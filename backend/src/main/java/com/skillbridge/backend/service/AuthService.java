package com.skillbridge.backend.service;

import com.skillbridge.backend.config.CustomUserDetails;
import com.skillbridge.backend.dto.request.*;
import com.skillbridge.backend.dto.response.LoginResponse;
import com.skillbridge.backend.dto.response.RegisterResponse;
import com.skillbridge.backend.entity.InvalidatedToken;
import com.skillbridge.backend.entity.User;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.repository.CompanyMemberRepository;
import com.skillbridge.backend.repository.InvalidatedTokenRepository;
import com.skillbridge.backend.repository.UserRepository;
import com.skillbridge.backend.utils.SecurityUtils;
import io.jsonwebtoken.Claims;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Date;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthService {
    InvalidatedTokenRepository invalidatedTokenRepository;
    UserRepository userRepository;
    CompanyMemberRepository companyMemberRepository;
    PasswordEncoder passwordEncoder;
    OtpService otpService;
    JwtService jwtService;
    SystemLogService systemLog;
    SecurityUtils securityUtils;
    FileStorageService fileStorageService;

    /**
     * Gửi OTP đăng ký tài khoản
     */
    public String register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new AppException(ErrorCode.EMAIL_EXIST);
        }

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
        otpService.sendOtpEmail(request.getEmail(), subject, content);
        return "Mã xác thực đăng ký tài khoản đã được gửi về mail";
    }

    /**
     * Xác thực OTP và hoàn tất đăng ký
     */
    @Transactional
    public RegisterResponse registerOtp(RegisterOtpRequest request) {
        if (!otpService.verifyOtp(request.getEmail(), request.getOtp())) {
            throw new AppException(ErrorCode.INVALID_OTP);
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setProvider("LOCAL");
        user.setPhoneNumber(request.getPhoneNumber());
        user.setName(request.getName());
        user.setAddress(request.getAddress());
        user.setStatus("ACTIVE");
        user.setRole("CANDIDATE");

        userRepository.saveAndFlush(user);

        systemLog.info(CustomUserDetails.fromUser(user), "Người dùng " + user.getEmail() + " đăng ký tài khoản thành công");

        String accessToken = jwtService.generateAccessTokens(
                user.getId(), user.getEmail(), user.getRole()
        );
        String refreshToken = jwtService.generateRefreshToken(user.getId());

        user.setRefreshToken(refreshToken);
        otpService.consumeOtp(request.getEmail());

        return new RegisterResponse(
                user.getEmail(),
                accessToken,
                refreshToken
        );
    }

    private User createUserCommon(
            String email,
            String fullName,
            String provider
    ) {

        if (userRepository.findByEmail(email).isPresent()) {
            throw new AppException(ErrorCode.EMAIL_EXIST);
        }

        User user = new User();
        user.setEmail(email);
        user.setName(fullName);
        user.setProvider(provider);
        user.setRole("CANDIDATE");

        return user;
    }
    @Transactional
    public RegisterResponse registerGoogle(String email, String name) {
        User user = userRepository.findByEmail(email)
                .orElseGet(() -> createUserCommon(email, name, "GOOGLE"));

        if (!"GOOGLE".equals(user.getProvider())) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_REGISTERED_BY_PASSWORD);
        }
        if (!"ACTIVE".equals(user.getStatus())) {
            throw new AppException(ErrorCode.USER_STATUS);
        }
        User savedUser = userRepository.saveAndFlush(user);
        systemLog.info(CustomUserDetails.fromUser(user), "User " + email + " đăng nhập qua Google");

        String accessToken = jwtService.generateAccessTokens(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getRole()
        );

        String refreshToken = jwtService.generateRefreshToken(savedUser.getId());
        savedUser.setRefreshToken(refreshToken);
        userRepository.save(savedUser);

        return new RegisterResponse(savedUser.getEmail(), accessToken, refreshToken);
    }

    /**
     * Đăng nhập
     */
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        System.out.println("user: " + user.toString());
        if (!"ACTIVE".equals(user.getStatus())) {
            throw new AppException(ErrorCode.USER_STATUS);
        }
        boolean matches = passwordEncoder.matches(request.getPassword(), user.getPassword());
        if (!matches) {
            systemLog.warn(CustomUserDetails.fromUser(user), "Đăng nhập thất bại: Sai mật khẩu");
            throw new AppException(ErrorCode.PASSWORD_INVALID);
        }

        if ("1".equals(user.getIs2faEnabled()) || "true".equalsIgnoreCase(user.getIs2faEnabled())) {
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

            return new LoginResponse("1", null, null, null);
        }
        systemLog.info(CustomUserDetails.fromUser(user), user.getEmail() + " đăng nhập thành công");
        return issueToken(user);
    }

    public LoginResponse verifyOtp(LoginRequest request) {
        boolean valid = otpService.verifyOtp(
                request.getEmail(),
                request.getOtp()
        );
        otpService.consumeOtp(request.getEmail());
        if (!valid) {
            throw new AppException(ErrorCode.INVALID_OTP);
        }
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHORIZED));

        if (!"ACTIVE".equals(user.getStatus())) {
            throw new AppException(ErrorCode.USER_STATUS);
        }

        systemLog.info(CustomUserDetails.fromUser(user), "Xác thực 2FA thành công");
        return issueToken(user);
    }

    @Transactional
    public LoginResponse issueToken(User user) {
        var memberOptional = companyMemberRepository.findByUser_Id(user.getId());
        if (memberOptional.isPresent()) {
            var member = memberOptional.get();
            if ("DEACTIVATED".equals(member.getCompany().getStatus().name())) {
                if (!"ADMIN".equals(member.getRole().name())) {
                    throw new AppException(ErrorCode.COMPANY_DEACTIVATED_MEMBER);
                }
            }
        }

        String accessToken = jwtService.generateAccessTokens(user.getId(), user.getEmail(), user.getRole());
        String refreshToken = jwtService.generateRefreshToken(user.getId());

        user.setRefreshToken(refreshToken);
        userRepository.save(user);
        return new LoginResponse("0", accessToken, refreshToken, user.getRole());
    }

    public String forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail()).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        if(user.getProvider().equals("GOOGLE")){
            throw new AppException(ErrorCode.GG_INVALID_FORGOT_PASSWORD);
        }
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

        String accessToken = jwtService.generateAccessTokens(user.getId(), user.getEmail(), user.getRole());
        String refreshToken = jwtService.generateRefreshToken(user.getId());
        user.setRefreshToken(refreshToken);
        userRepository.save(user);

        return new LoginResponse(user.getIs2faEnabled(), accessToken, refreshToken, user.getRole());
    }

    public User toggleTwoFactor(boolean is2faEnabled) {
        CustomUserDetails currentUser = securityUtils.getCurrentUser();
        System.out.println("is2faEnabled = " + is2faEnabled);
        User user = userRepository.findById(currentUser.getUserId()).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        user.setIs2faEnabled(String.valueOf(is2faEnabled));
        return userRepository.save(user);
    }

    public void logout(String jwt) {
        try {
            Claims claims = jwtService.extractClaims(jwt);
            String jti = claims.getId();
            Date expiryTime = claims.getExpiration();
            String userId = claims.getSubject();

            InvalidatedToken invalidatedToken = new InvalidatedToken();
            invalidatedToken.setId(jti);
            invalidatedToken.setExpiryTime(expiryTime);
            invalidatedTokenRepository.save(invalidatedToken);

            userRepository.findById(userId).ifPresent(user -> {
                user.setRefreshToken(null);
                userRepository.save(user);
                systemLog.info(CustomUserDetails.fromUser(user), user.getEmail() + " đã đăng xuất");
            });

            System.out.println("[LOGOUT] User ID: " + userId + " đã logout thành công.");

        } catch (AppException e) {
            if (e.getErrorCode() == ErrorCode.TOKEN_EXPIRED) {
                return;
            }
            throw e;
        }
    }
    public void changePassword(ChangePasswordRequest request) {
        try {
            CustomUserDetails currentUser = securityUtils.getCurrentUser();

            User user = userRepository.findById(currentUser.getUserId())
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

            if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
                log.warn("[CHANGE-PASSWORD] Sai mật khẩu cũ cho user: {}", user.getEmail());
                throw new AppException(ErrorCode.PASSWORD_INVALID);
            }
            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
            userRepository.save(user);

            systemLog.info(currentUser, "Người dùng " + user.getEmail() + " đã đổi mật khẩu thành công");
            log.info("[CHANGE-PASSWORD] Change password success for user: {}", user.getEmail());

        } catch (AppException ex) {
            log.error("[CHANGE-PASSWORD] AppException occurred: {}", ex.getErrorCode());
            throw ex;
        } catch (Exception ex) {
            log.error("[CHANGE-PASSWORD] Unexpected error: ", ex);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    @Transactional(rollbackFor = Exception.class)
    public String updateAvatar(MultipartFile file) throws IOException {
        CustomUserDetails currentUser = securityUtils.getCurrentUser();
        String userId = currentUser.getUserId();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }
        if (user.getAvatar() != null) {
            fileStorageService.deleteFile(user.getAvatar());
        }
        String avatarUrl = fileStorageService.saveFile(file, "avatars");

        user.setAvatar(avatarUrl);
        userRepository.save(user);
        return avatarUrl;
    }
}
