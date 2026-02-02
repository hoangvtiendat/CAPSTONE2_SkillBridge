package com.skillbridge.backend.service;

import com.skillbridge.backend.dto.request.UserCreationRequest;
import com.skillbridge.backend.dto.request.UserUpdateRequest;
import com.skillbridge.backend.entity.User;
import com.skillbridge.backend.repository.UserRepository;
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

    public User createUser(UserCreationRequest request) {
        User user = new User();
        String hashedPassword = passwordEncoder.encode(request.getPassword());
        user.setPassword(hashedPassword);
        user.setEmail(request.getEmail());

        return userRepository.save(user);
    }

    public User updateUser(String id, UserUpdateRequest request) {
        User user = getUser(id);

        user.setPassword(request.getPassword());
        user.setEmail(request.getEmail());

        return userRepository.save(user);
    }

    public List<User> getUsers() {
        return userRepository.findAll();
    }

    public User getUser(String id) {
        return userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found!"));
    }

    public void deleteUser(String id) {
        User user = getUser(id);
        userRepository.delete(user);
    }
}
