package com.skillbridge.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;


@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    //khi sử dụng spring-boost-starter-security thì nó sẽ tự động khoá toàn bộ các API nếu như không có token(chưa login)
    //hàm này để cho phép gọi các API mà không cần dùng Auth
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/auth/**",
                                "/api/public/**"
                        ).permitAll()
                        .anyRequest().authenticated() // Bắt buộc login ngoaị trừ api auth và api public
                )
                .build();
    }
}
