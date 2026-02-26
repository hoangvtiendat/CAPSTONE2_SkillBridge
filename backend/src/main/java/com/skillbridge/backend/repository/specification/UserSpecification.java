package com.skillbridge.backend.repository.specification;

import com.skillbridge.backend.entity.User;
import org.springframework.data.jpa.domain.Specification;

public class UserSpecification {

    public static Specification<User> hasName(String name) {
        return (root, query, cb) -> name == null ? cb.conjunction() : cb.like(cb.lower(root.get("name")), "%" + name.toLowerCase() + "%");
    }

    public static Specification<User> hasEmail(String email) {
        return (root, query, cb) -> email == null ? cb.conjunction() : cb.like(cb.lower(root.get("email")), "%" + email.toLowerCase() + "%");
    }

    public static Specification<User> hasRole(String role) {
        return (root, query, cb) -> role == null ? cb.conjunction() : cb.equal(root.get("role"), role);
    }

    public static Specification<User> hasStatus(String status) {
        return (root, query, cb) -> status == null ? cb.conjunction() : cb.equal(root.get("status"), status);
    }
}
