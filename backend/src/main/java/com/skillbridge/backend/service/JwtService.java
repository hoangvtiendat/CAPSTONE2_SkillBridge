package com.skillbridge.backend.service;

import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.repository.InvalidatedTokenRepository;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;

@Service
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class JwtService {
    InvalidatedTokenRepository invalidatedTokenRepository;
    SecretKey key;
    long expiration;
    long refreshExpiration;

    public JwtService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration}") long expiration,
            @Value("${jwt.refresh-expiration}") long refreshExpiration,
            InvalidatedTokenRepository invalidatedTokenRepository
    ) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expiration = expiration;
        this.refreshExpiration = refreshExpiration;
        this.invalidatedTokenRepository = invalidatedTokenRepository;
    }

    public String generateAccessTokens(String userId, String email, String role) {
        return generateToken(Map.of("role", role, "email", email), userId, expiration);
    }

    public String generateRefreshToken(String userId) {
        return generateToken(Map.of(), userId, refreshExpiration);
    }

    private String generateToken(Map<String, Object> claims, String subject, long expTime) {
        if (subject == null || subject.isBlank()) {
            throw new IllegalArgumentException("UserId (subject) cannot be null!");
        }

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setId(UUID.randomUUID().toString())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expTime))
                .signWith(key)
                .compact();
    }

    public Claims extractClaims(String token) {
        return extractAllClaims(token);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
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
        try {
            Claims claims = extractAllClaims(token);
            String jti = claims.getId();
            if (jti != null && invalidatedTokenRepository.existsById(jti)) {
                log.warn("[AUTH] Token blacklisted: {}", jti);
                return false;
            }
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public String getUserId(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public String getEmail(String token) {
        return extractClaim(token, claims -> claims.get("email", String.class));
    }

    public String getRole(String token) {
        return extractClaim(token, claims -> claims.get("role", String.class));
    }
}