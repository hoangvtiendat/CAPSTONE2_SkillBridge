package com.skillbridge.backend.service;

import com.skillbridge.backend.config.CustomUserDetails;
import com.skillbridge.backend.entity.User;
import com.skillbridge.backend.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final com.skillbridge.backend.repository.UserRepository userRepository;
    private final com.skillbridge.backend.repository.CompanyMemberRepository companyMemberRepository;

    public JwtAuthenticationFilter(JwtService jwtService, 
                                 com.skillbridge.backend.repository.UserRepository userRepository,
                                 com.skillbridge.backend.repository.CompanyMemberRepository companyMemberRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.companyMemberRepository = companyMemberRepository;
    }
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();

        return path.startsWith("/oauth2/")
                || path.startsWith("/login/");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        if (request.getServletPath().contains("/auth") || request.getServletPath().contains("/public")) {
            filterChain.doFilter(request, response);
            return;
        }

        String header = request.getHeader("Authorization");

        if (header == null || !header.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = header.substring(7);

        if (!jwtService.validateToken(token)) {
            filterChain.doFilter(request, response);
            return;
        }

        String userId = jwtService.getUserId(token);

        // Kiểm tra status người dùng trong database
        var userOptional = userRepository.findById(userId);
        if (userOptional.isEmpty() || !"ACTIVE".equals(userOptional.get().getStatus())) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write("{\"code\": 3003, \"message\": \"Tài khoản đã bị khóa\"}");
            return;
        }

        // US09: Kiểm tra nếu công ty bị vô hiệu hóa
        var memberOptional = companyMemberRepository.findByUser_Id(userId);
        if (memberOptional.isPresent()) {
            var member = memberOptional.get();
            var company = member.getCompany();
            if ("DEACTIVATED".equals(company.getStatus().name())) {
                // Chỉ cho phép Company ADMIN truy cập các endpoint liên quan đến identity/reactivate
                if (!"ADMIN".equals(member.getRole().name())) {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json");
                    response.setCharacterEncoding("UTF-8");
                    response.getWriter().write("{\"code\": 6011, \"message\": \"Công ty của bạn đã bị vô hiệu hóa. Bạn tạm thời không thể truy cập quyền nhà tuyển dụng.\"}");
                    return;
                }
                
                // Admin vẫn được vào nhưng có thể bị hạn chế ở các API khác ngoài reactivate (tùy logic Controller)
                // Ở đây ta cho phép Admin đi tiếp để họ có thể gọi API reactivate hoặc xem profile
            }
        }

        User user = userOptional.get();
        String email = user.getEmail();
        String role = user.getRole();

        CustomUserDetails userDetails =
                new CustomUserDetails(userId, email, role);

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                );

        SecurityContextHolder.getContext()
                .setAuthentication(authentication);

        filterChain.doFilter(request, response);
    }
}
