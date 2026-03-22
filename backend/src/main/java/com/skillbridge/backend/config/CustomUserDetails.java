package com.skillbridge.backend.config;

import com.skillbridge.backend.entity.User;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Builder;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class CustomUserDetails implements UserDetails {

    private final String userId;
    private final String email;
    private final String role;

    public static CustomUserDetails fromUser(User user) {
        if (user == null) return null;
        return CustomUserDetails.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role));
    }

    @Override
    public String getPassword() {
        return null; // Vì xác thực qua Token, không cần lưu Password ở đây
    }

    @Override
    public String getUsername() {
        return email;
    }

    // Các trạng thái tài khoản mặc định là true
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return true; }
}