package com.skillbridge.backend.repository;
import com.skillbridge.backend.entity.NotificationForAI;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificationForAIReporitory extends JpaRepository<NotificationForAI, String> {
    @Query("SELECT J FROM NotificationForAI J WHERE J.company = :companyID")
    List<NotificationForAI> findByCompanyID(@Param("companyID") String companyID);
}
