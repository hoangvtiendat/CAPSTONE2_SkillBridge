package com.skillbridge.backend.repository;

import com.skillbridge.backend.entity.SystemLog;
import com.skillbridge.backend.enums.LogLevel;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SystemLogRepository extends JpaRepository<SystemLog,String> {

    @Query("SELECT s FROM SystemLog s WHERE " +
            "(:level IS NULL OR s.logLevel = :level) AND " +
            "(:cursor IS NULL OR s.id < :cursor) AND " +
            "(:date IS NULL OR FUNCTION('DATE', s.createdAt) = CAST(:date AS date)) " +
            "ORDER BY s.createdAt DESC, s.id DESC")
    List<SystemLog> getLogs(@Param("level") LogLevel level,
                            @Param("cursor") String cursor,
                            @Param("date") String date,
                            Pageable pageable);
}
