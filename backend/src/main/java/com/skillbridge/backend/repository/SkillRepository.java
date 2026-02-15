package com.skillbridge.backend.repository;

import com.skillbridge.backend.entity.Skill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SkillRepository extends JpaRepository<Skill, String> {
    @Query("SELECT s FROM Skill s WHERE s.id = :id")
    Optional<Skill> findById(@Param("id") String id);

    List<Skill> findByNameContainingIgnoreCase(String name);
    List<Skill> findByName(String name);

}
