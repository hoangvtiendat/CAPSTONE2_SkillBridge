package com.skillbridge.backend.service;

import com.skillbridge.backend.dto.request.UserCreationRequest;
import com.skillbridge.backend.dto.request.UserUpdateRequest;
import com.skillbridge.backend.entity.User;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JwtService jwtService;

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

        User user = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        System.out.println("user = " + user);

        return user;
    }

    @Transactional
    public User updateMe(String token, UserUpdateRequest request) {
        User user = getMe(token);

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
        return userRepository.saveAndFlush(user);

    }
}
