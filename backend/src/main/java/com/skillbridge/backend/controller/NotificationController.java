package com.skillbridge.backend.controller;

import com.skillbridge.backend.dto.response.ApiResponse;
import com.skillbridge.backend.dto.response.NotificationResponse;
import com.skillbridge.backend.entity.NotificationForAI;
import com.skillbridge.backend.entity.User;
import com.skillbridge.backend.service.NotificationService;
import com.skillbridge.backend.service.UserService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class NotificationController {
    NotificationService notificationService;
    UserService userService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getNotifications() {
        User currentUser = userService.getMe();
        List<NotificationResponse> notifications = notificationService.getNotificationsForUser(currentUser.getId());
        return ResponseEntity.ok(new ApiResponse<>(
                HttpStatus.OK.value(),
                "Lấy danh sách thông báo thành công",
                notifications
        ));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable String id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok(new ApiResponse<>(
                HttpStatus.OK.value(),
                "Đã đánh dấu thông báo là đã đọc",
                null
        ));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead() {
        User currentUser = userService.getMe();
        notificationService.markAllAsRead(currentUser.getId());
        return ResponseEntity.ok(new ApiResponse<>(
                HttpStatus.OK.value(),
                "Đã đánh dấu tất cả thông báo là đã đọc",
                null
        ));
    }
    @GetMapping("/Ai")
    public ResponseEntity<ApiResponse<List<NotificationForAI>>> getNotificationsByAi() {
        User currentUser = userService.getMe();
        String company_id = currentUser.getCompanyId();
        List<NotificationForAI> notificationAI = notificationService.getNotificationsByAI(company_id);
        return ResponseEntity.ok(new ApiResponse<>(
                HttpStatus.OK.value(),
                "Lấy danh sách thông báo thành công",
                notificationAI
        ));
    }

}
