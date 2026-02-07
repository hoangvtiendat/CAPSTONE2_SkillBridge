package com.skillbridge.backend.service;

import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.repository.InvalidatedTokenRepository;
import com.skillbridge.backend.repository.UserRepository;
import io.jsonwebtoken.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.UUID;
import javax.crypto.SecretKey;

import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;

import java.util.Date;
import java.util.Map;

import com.skillbridge.backend.entity.User;

@Service
public class JwtService {
    @Autowired
    private InvalidatedTokenRepository invalidatedTokenRepository;
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
                .setId(UUID.randomUUID().toString())
                .setIssuedAt(now)
                .setExpiration(exp)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public Claims extractClaims(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (ExpiredJwtException e) {
            throw new AppException(ErrorCode.TOKEN_EXPIRED);
        } catch (JwtException e) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
    }

    public boolean validateToken(String token) {
//        try {
//            extractClaims(token);
//            return true;
//        } catch (JwtException e) {
//            return false;
//        }
        try {
            Claims claims = extractClaims(token);
            String jti = claims.getId(); // Lấy ID duy nhất của token

            // Kiểm tra xem token này có nằm trong danh sách đen không
            if (jti != null && invalidatedTokenRepository.existsById(jti)) {
                System.out.println("[AUTH] Token đã bị vô hiệu hóa (Blacklisted): " + jti);
                return false;
            }
            return true;
        } catch (JwtException | AppException e) {
            // Nếu token hết hạn hoặc không hợp lệ, trả về false
            return false;
        }
    }

    public String getUserId(String token) {
        return extractClaims(token).getSubject();
    }

    public String getEmail(String token) {
        String email = extractClaims(token).get("email", String.class);
        System.out.println("Email : " + email);
        return email;
    }

    public String getRole(String token) {
        String role = extractClaims(token).get("role", String.class);
        System.out.println("Role : " + role);
        return role;
    }
}
