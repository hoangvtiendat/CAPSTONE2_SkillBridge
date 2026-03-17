package com.skillbridge.backend.service;

import com.skillbridge.backend.dto.request.UserCreationRequest;
import com.skillbridge.backend.dto.request.UserUpdateRequest;
import com.skillbridge.backend.dto.response.UserResponse;
import com.skillbridge.backend.entity.CompanyMember;
import com.skillbridge.backend.entity.User;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.repository.CompanyMemberRepository;
import com.skillbridge.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JwtService jwtService;
    @Autowired
    private CompanyMemberRepository companyMemberRepository;

    public User createUser(UserCreationRequest request) {
        User user = new User();
        String hashedPassword = passwordEncoder.encode(request.getPassword());
        user.setPassword(hashedPassword);
        user.setEmail(request.getEmail());

        return userRepository.save(user);
    }

    public User updateUser(String id, UserUpdateRequest request) {
        User user = getUser(id);
        user.setEmail(request.getEmail());
        return userRepository.save(user);
    }

    public List<User> getUsers() {
        return userRepository.findAll();
    }

    public User getUser(String id) {
        return userRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    public void deleteUser(String id) {
        User user = getUser(id);
        userRepository.delete(user);
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
        if (userId == null) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        User user = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        System.out.println("user = " + user);

        // Populate transient company fields
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
    public User updateMe(String token, UserUpdateRequest request) {
        User user = userRepository.findById(jwtService.getUserId(token))
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

        return user;
    }

    public UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .address(user.getAddress())
                .role(user.getRole())
                .status(user.getStatus())
                .is2faEnabled(user.getIs2faEnabled())
                .createdAt(user.getCreatedAt())
                .companyName(user.getCompanyName())
                .companyId(user.getCompanyId())
                .companyTaxId(user.getCompanyTaxId())
                .companyStatus(user.getCompanyStatus())
                .companyRole(user.getCompanyRole())
                .build();
    }
}
