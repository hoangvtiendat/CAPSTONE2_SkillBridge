package com.skillbridge.backend.repository.specification;

import com.skillbridge.backend.entity.Company;
import com.skillbridge.backend.enums.CompanyStatus;
import org.springframework.data.jpa.domain.Specification;

public class CompanySpecification {

    public static Specification<Company> hasName(String name) {
        return (root, query, cb) -> name == null ? cb.conjunction() : cb.like(cb.lower(root.get("name")), "%" + name.toLowerCase() + "%");
    }

    public static Specification<Company> hasTaxId(String taxId) {
        return (root, query, cb) -> taxId == null ? cb.conjunction() : cb.like(root.get("taxId"), "%" + taxId + "%");
    }

    public static Specification<Company> hasStatus(CompanyStatus status) {
        return (root, query, cb) -> status == null ? cb.conjunction() : cb.equal(root.get("status"), status);
    }
}
