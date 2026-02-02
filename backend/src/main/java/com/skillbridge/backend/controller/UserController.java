package com.skillbridge.backend.controller;

import com.skillbridge.backend.dto.request.UserCreationRequest;
import com.skillbridge.backend.dto.request.UserUpdateRequest;
import com.skillbridge.backend.entity.User;
import com.skillbridge.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("users")
public class  UserController {
    @Autowired
    private UserService userService;

    @PostMapping
    User createUser(@RequestBody UserCreationRequest request) {
        return userService.createUser(request);
    }

    @GetMapping
    List<User> getAllUsers() {
        return userService.getUsers();
    }

    //Chỉ cho phép ADMIN getuser
    // api get - .../identity/users
    @PreAuthorize("hashRole('ADMIN')")
    @GetMapping("/{userid}")
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


}
