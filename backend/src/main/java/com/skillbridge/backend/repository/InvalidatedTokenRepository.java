package com.skillbridge.backend.repository;

import com.skillbridge.backend.entity.InvalidatedToken;
import com.skillbridge.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InvalidatedTokenRepository extends JpaRepository<InvalidatedToken, String> {
}
