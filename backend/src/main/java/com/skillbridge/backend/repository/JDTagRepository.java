package com.skillbridge.backend.repository;

import com.skillbridge.backend.entity.JDTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface JDTagRepository extends JpaRepository<JDTag, String> {


    List<JDTag> findAll();

    @Query("select j.name from JDTag j")
    List<String> findAllTagNames();

    boolean existsByName(String name);
}