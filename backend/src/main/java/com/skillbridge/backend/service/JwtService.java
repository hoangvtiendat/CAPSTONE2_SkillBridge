package com.skillbridge.backend.service;

import com.skillbridge.backend.repository.UserRepository;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;

import java.io.IOException;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.skillbridge.backend.entity.User;

@Service
public class JwtService {
    private final SecretKey key;
    private final long expiration;
    private final long refreshExpiration;
    private UserRepository userRepository;
    public JwtService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration}") long expiration,
            @Value("${jwt.refresh-expiration}") long refreshExpiration,
            UserRepository userRepository
    ) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
        this.expiration = expiration;
        this.refreshExpiration = refreshExpiration;
        this.userRepository = userRepository;
    }

    public String generateAccesToken(String userId, String email, String role) {
        return generateToken(
                Map.of("role", role, "email", email),
                userId,
                expiration
        );
    }

    public String generateRefreshToken(String userId) {
        return generateToken(
                Map.of(), userId, refreshExpiration
        );
    }

    private String generateToken(Map<String, Object> claims, String subject, long expTime) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + expTime);

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(now)
                .setExpiration(exp)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public Claims extractClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJwt(token)
                .getBody();
    }

    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        if (!validateToken(token)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        String email = getEmail(token);
        String role = getRole(token);

        Optional<User> user = userRepository.findByEmail(email);

        List<GrantedAuthority> authorities =
                List.of(new SimpleGrantedAuthority("ROLE_" + role));

        Authentication auth = new UsernamePasswordAuthenticationToken(
                user, null, authorities
        );

        SecurityContextHolder.getContext().setAuthentication(auth);
        filterChain.doFilter(request, response);
    }

    public boolean validateToken(String token) {
        try {
            extractClaims(token);
            return true;
        } catch (JwtException e) {
            return false;
        }
    }

    public String getUserId(String token) {
        return extractClaims(token).getSubject();
    }

    public String getEmail(String token) {
        String email = extractClaims(token).get("email", String.class);
        System.out.println("Email : "+email);
        return email;
    }

    public String getRole(String token) {
        String role = extractClaims(token).get("role", String.class);
        System.out.println("Role : "+role);
        return role;
    }
}
