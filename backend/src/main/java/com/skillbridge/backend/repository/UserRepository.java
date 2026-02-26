package com.skillbridge.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.skillbridge.backend.entity.User;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmail(String email);

    long countByCreatedAtAfter(LocalDateTime createdAtAfter);

    long countByCreatedAtBetween(LocalDateTime createdAtAfter, LocalDateTime createdAtBefore);
}
