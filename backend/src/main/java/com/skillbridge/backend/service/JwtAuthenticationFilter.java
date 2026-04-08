package com.skillbridge.backend.service;

import com.skillbridge.backend.config.CustomUserDetails;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.repository.CompanyMemberRepository;
import com.skillbridge.backend.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    JwtService jwtService;
    UserRepository userRepository;
    CompanyMemberRepository companyMemberRepository;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        return path.startsWith("/oauth2/")
                || path.equals("/auth/login")
                || path.equals("/auth/register")
                || path.startsWith("/auth/forgot-password")
                || path.startsWith("/public/");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String token = authHeader.substring(7);

        if (!jwtService.validateToken(token)) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String userId = jwtService.getUserId(token);
            String email = jwtService.getEmail(token);
            String role = jwtService.getRole(token);
            var user = userRepository.findById(userId).orElse(null);
            if (user == null || !"ACTIVE".equals(user.getStatus())) {
                sendErrorResponse(response, ErrorCode.USER_STATUS_LOCKED);
                return;
            }

            if (isCompanyRelatedAction(request.getServletPath())) {
                if (!checkCompanyStatus(userId, response)) return;
            }
            CustomUserDetails userDetails = new CustomUserDetails(userId, email, role);
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities()
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

        } catch (Exception e) {
            log.error("Cannot set user authentication: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    private boolean checkCompanyStatus(String userId, HttpServletResponse response) throws IOException {
        var memberOptional = companyMemberRepository.findByUser_Id(userId);
        if (memberOptional.isPresent()) {
            var member = memberOptional.get();
            if ("DEACTIVATED".equals(member.getCompany().getStatus().name())
                    && !"ADMIN".equals(member.getRole().name())) {
                sendErrorResponse(response, ErrorCode.COMPANY_ALREADY_DEACTIVATED);
                return false;
            }
        }
        return true;
    }

    private void sendErrorResponse(HttpServletResponse response, ErrorCode errorCode) throws IOException {
        response.setStatus(errorCode.getCode());
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String jsonResponse = String.format(
                "{\"code\": %d, \"message\": \"%s\"}",
                errorCode.getCode(),
                errorCode.getMessage()
        );

        response.getWriter().write(jsonResponse);
    }

    private boolean isCompanyRelatedAction(String path) {
        return path.startsWith("/jobs") || path.startsWith("/recruitment");
    }
}