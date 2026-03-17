package com.skillbridge.backend.controller;

import com.skillbridge.backend.config.CustomUserDetails;
import com.skillbridge.backend.dto.response.ApiResponse;
import com.skillbridge.backend.dto.response.CompanyMemberResponse;
import com.skillbridge.backend.enums.CompanyRole;
import com.skillbridge.backend.service.CompanyMemberService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/company-member")
public class CompanyMember {
    @Autowired
    CompanyMemberService companyMemberService;

    @GetMapping("/getRole")
    public CompanyRole getRle (){
        return companyMemberService.getRole();
    }

    @GetMapping("/getMember")
    public ResponseEntity<ApiResponse<List<CompanyMemberResponse>>> getMember(
            @AuthenticationPrincipal CustomUserDetails user
    ){
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ApiResponse<>(
                    401,
                    "Bạn chưa đăng nhập hoặc Token không hợp lệ",
                    null
            ));
        }
        List<CompanyMemberResponse> rs = companyMemberService.getMember(user.getUserId());
        ApiResponse<List<CompanyMemberResponse>> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Danh sách thành viên của công ty",
                rs
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/memberPending")
    public ResponseEntity<ApiResponse<List<CompanyMemberResponse>>> getMemberPending(
            @AuthenticationPrincipal CustomUserDetails user
    ){
        List<CompanyMemberResponse> rs = companyMemberService.getMemberPending(user.getUserId());
        ApiResponse<List<CompanyMemberResponse>> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Danh sách thành viên đang chờ duyệt",
                rs
        );
        return ResponseEntity.ok(response);
    }
}
