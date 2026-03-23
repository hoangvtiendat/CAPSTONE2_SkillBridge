package com.skillbridge.backend.controller;

import com.skillbridge.backend.config.CustomUserDetails;
import com.skillbridge.backend.dto.request.UserCreationRequest;
import com.skillbridge.backend.dto.request.UserUpdateRequest;
import com.skillbridge.backend.dto.response.ApiResponse;
import com.skillbridge.backend.dto.response.UserResponse;
import com.skillbridge.backend.entity.User;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/users")
public class UserController {
    UserService userService;

    @PostMapping
    User createUser(@RequestBody UserCreationRequest request) {
        return userService.createUser(request);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    List<User> getAllUsers() {
        return userService.getUsers();
    }

    @GetMapping("/{userid}  ")
    User getUser(@PathVariable String userid) {
        return userService.getUser(userid);
    }

    @PutMapping("/{userid}")
    User updateUser(@PathVariable String userid, @RequestBody UserUpdateRequest request) {
        return userService.updateUser(userid, request);
    }

    @DeleteMapping("/{userid}")
    String deleteUser(@PathVariable String userid) {
        userService.deleteUser(userid);
        System.out.println("User deleted");
        return "User deleted";
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getMe(
    ) {
        try {
            User user = userService.getMe();
            UserResponse rs = userService.mapToUserResponse(user);
            ApiResponse<UserResponse> response = new ApiResponse<>(
                    HttpStatus.OK.value(), "Lấy dữ liệu cá nhân thành công", rs
            );
            return ResponseEntity.ok(response);
        } catch (AppException ex) {
            System.out.println("[GET-ME] AppException occurred");
            System.out.println("[GET-ME] ErrorCode: " + ex.getErrorCode());
            throw ex;
        }

    }

    @PatchMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> updateMe(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @RequestBody UserUpdateRequest request
    ) {
        try {
            User user = userService.updateMe(currentUser.getUserId(), request);
            UserResponse rs = userService.mapToUserResponse(user);
            ApiResponse<UserResponse> response = new ApiResponse<>(
                    HttpStatus.OK.value(), "Chỉnh sửa thông tin cá nhân thành công", rs
            );
            return ResponseEntity.ok(response);
        } catch (AppException ex) {
            System.out.println("[PATCH-ME] AppException occurred");
            System.out.println("[PATCH-ME] ErrorCode: " + ex.getErrorCode());
            throw ex;
        }
    }
}
