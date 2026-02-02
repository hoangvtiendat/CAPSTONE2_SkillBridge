package com.skillbridge.backend.service;

import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.Map;

@Service
public class JwtService {
    private final SecretKey key;
    private final long expiration;
    private final long refreshExpiration;

    public JwtService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration}") long expiration,
            @Value("${jwt.refresh-expiration}") long refreshExpiration
    ) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
        this.expiration = expiration;
        this.refreshExpiration = refreshExpiration;

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

}
