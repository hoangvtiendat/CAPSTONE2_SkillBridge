package com.skillbridge.backend.service;

import com.skillbridge.backend.config.CustomUserDetails;
import com.skillbridge.backend.dto.request.UserCreationRequest;
import com.skillbridge.backend.dto.request.UserUpdateRequest;
import com.skillbridge.backend.dto.response.UserResponse;
import com.skillbridge.backend.entity.User;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.repository.CompanyMemberRepository;
import com.skillbridge.backend.repository.UserRepository;
import com.skillbridge.backend.utils.SecurityUtils;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class UserService {
    UserRepository userRepository;
    PasswordEncoder passwordEncoder;
    JwtService jwtService;
    CompanyMemberRepository companyMemberRepository;
    SystemLogService systemLog;
    SecurityUtils securityUtils;

    /**
     * Tạo người dùng mới và mã hóa mật khẩu
     */
    public User createUser(UserCreationRequest request) {
        User user = new User();
        String hashedPassword = passwordEncoder.encode(request.getPassword());
        user.setPassword(hashedPassword);
        user.setEmail(request.getEmail());

        User savedUser = userRepository.save(user);

        systemLog.info(null, "Hệ thống: Tạo tài khoản mới cho email: " + savedUser.getEmail());

        return savedUser;
    }

    /**
     * Cập nhật thông tin cơ bản của người dùng theo ID
     */
    @Transactional
    public User updateUser(String id, UserUpdateRequest request) {
        User user = getUser(id);
        user.setEmail(request.getEmail());

        CustomUserDetails currentUser = securityUtils.getCurrentUser();
        systemLog.warn(currentUser, "Admin cập nhật thông tin người dùng ID: " + id);

        return userRepository.save(user);
    }

    /**
     * Lấy danh sách tất cả người dùng
     */
    public List<User> getUsers() {
        return userRepository.findAll();
    }

    /**
     * Tìm người dùng theo ID
     */
    public User getUser(String id) {
        return userRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    /**
     * Xóa người dùng
     */
    @Transactional
    public void deleteUser(String id) {
        User user = getUser(id);
        user.setDeleted(true);
        userRepository.save(user);

        CustomUserDetails currentUser = securityUtils.getCurrentUser();
        systemLog.danger(currentUser, "Xóa người dùng (Soft Delete) ID: " + id);
    }

    /**
     * Lấy thông tin chi tiết người dùng hiện tại
     */
    public User getMe() {
        CustomUserDetails currentUser = securityUtils.getCurrentUser();
        User user = userRepository.findById(currentUser.getUserId()).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        System.out.println("user = " + user);
        companyMemberRepository.findByUser_Id(user.getId()).ifPresent(member -> {
            user.setCompanyName(member.getCompany().getName());
            user.setCompanyId(member.getCompany().getId());
            user.setCompanyTaxId(member.getCompany().getTaxId());
            user.setCompanyStatus(member.getCompany().getStatus().name());
            user.setCompanyRole(member.getRole().name());
        });

        return user;
    }

    @Transactional
    public User updateMe(String userId, UserUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (request.getName() != null) {
            user.setName(request.getName());
        }
        if (request.getEmail() != null) {
            user.setEmail(request.getEmail());
        }
        if (request.getAddress() != null) {
            user.setAddress(request.getAddress());
        }
        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber());
        }
        userRepository.saveAndFlush(user);

        // Re-populate company fields
        companyMemberRepository.findByUser_Id(user.getId()).ifPresent(member -> {
            user.setCompanyName(member.getCompany().getName());
            user.setCompanyId(member.getCompany().getId());
            user.setCompanyTaxId(member.getCompany().getTaxId());
            user.setCompanyStatus(member.getCompany().getStatus().name());
            user.setCompanyRole(member.getRole().name());
        });

        CustomUserDetails currentUser = securityUtils.getCurrentUser();
        systemLog.info(currentUser, "Người dùng tự cập nhật thông tin cá nhân");

        return user;
    }

    /**
     * Chuyển đổi Entity User sang UserResponse DTO
     */
    public UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .avatar(user.getAvatar())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .address(user.getAddress())
                .role(user.getRole())
                .status(user.getStatus())
                .is2faEnabled(user.getIs2faEnabled())
                .provider(user.getProvider())
                .createdAt(user.getCreatedAt())
                .companyName(user.getCompanyName())
                .companyId(user.getCompanyId())
                .companyTaxId(user.getCompanyTaxId())
                .companyStatus(user.getCompanyStatus())
                .companyRole(user.getCompanyRole())
                .build();
    }
}
