package com.skillbridge.backend.repository;

import com.skillbridge.backend.entity.SystemLog;
import com.skillbridge.backend.enums.LogLevel;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SystemLogRepository extends JpaRepository<SystemLog, String> {

    @Query("""
        SELECT s FROM SystemLog s
        WHERE s.isDeleted = false
        AND (:level IS NULL OR s.logLevel = :level)
        AND (:startDate IS NULL OR s.createdAt >= :startDate)
        AND (:endDate IS NULL OR s.createdAt <= :endDate)
        AND (:search IS NULL OR LOWER(s.action) LIKE LOWER(CONCAT('%', :search, '%')))
        AND (:cursorId IS NULL OR
            s.createdAt < (SELECT s2.createdAt FROM SystemLog s2 WHERE s2.id = :cursorId) OR
            (s.createdAt = (SELECT s2.createdAt FROM SystemLog s2 WHERE s2.id = :cursorId) AND s.id < :cursorId)
        )
        ORDER BY s.createdAt DESC, s.id DESC
    """)
    List<SystemLog> getLogs(
            @Param("level") LogLevel level,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("search") String search,
            @Param("cursorId") String cursorId,
            Pageable pageable
    );
}
