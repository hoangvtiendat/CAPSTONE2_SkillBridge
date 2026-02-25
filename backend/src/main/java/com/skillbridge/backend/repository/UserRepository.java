package com.skillbridge.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.skillbridge.backend.entity.User;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String>, JpaSpecificationExecutor<User> {
    Optional<User> findByEmail(String email);
}
