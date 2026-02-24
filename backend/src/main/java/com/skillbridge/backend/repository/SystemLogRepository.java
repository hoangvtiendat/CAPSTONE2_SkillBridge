package com.skillbridge.backend.repository;

import com.skillbridge.backend.entity.SystemLog;
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
            "(:cursor IS NULL OR s.id < :cursor) " +
            "ORDER BY s.createdAt DESC, s.id DESC")
    List<SystemLog> getLogs(@Param("level") String level,
                                       @Param("cursor") String cursor,
                                       Pageable pageable);
}
