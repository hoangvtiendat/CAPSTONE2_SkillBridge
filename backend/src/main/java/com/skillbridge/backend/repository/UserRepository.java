package com.skillbridge.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.skillbridge.backend.entity.User;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    User findByUsername(String username);

    Optional<User> findByEmail(String email);
//    User findByEmail(String email);
}
