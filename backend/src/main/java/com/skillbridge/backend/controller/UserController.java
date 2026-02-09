package com.skillbridge.backend.controller;

import com.skillbridge.backend.dto.request.UserCreationRequest;
import com.skillbridge.backend.dto.request.UserUpdateRequest;
import com.skillbridge.backend.dto.response.ApiResponse;
import com.skillbridge.backend.entity.User;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
public class  UserController {
    @Autowired
    private UserService userService;

    @PostMapping
    User createUser(@RequestBody UserCreationRequest request) {
        return userService.createUser(request);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    List<User> getAllUsers() {
        return userService.getUsers();
    }

    //Chỉ cho phép ADMIN getuser
    // api get - .../identity/users
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


    // Personal Information
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<User>> getMe(@Valid @RequestHeader(value = "Authorization") String token) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                throw new AppException(ErrorCode.UNAUTHORIZED);
            }
            String jwt = token.substring(7);

            User rs = userService.getMe(jwt);
            ApiResponse<User> response = new ApiResponse<>(
                    HttpStatus.OK.value(), "Lấy dữ liệu cá nhân thành công", rs
            );
            return ResponseEntity.ok(response);
        } catch (AppException ex) {
            System.out.println("[GET-ME] AppException occurred");
            System.out.println("[GET-ME] ErrorCode: " + ex.getErrorCode());
            throw ex;
        }

    }

}
