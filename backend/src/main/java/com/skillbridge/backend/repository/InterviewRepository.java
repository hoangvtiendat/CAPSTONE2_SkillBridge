package com.skillbridge.backend.repository;

import com.skillbridge.backend.entity.Application;
import com.skillbridge.backend.entity.CVJobEvaluation;
import com.skillbridge.backend.entity.Interview;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InterviewRepository extends JpaRepository<Interview, String> {
    void deleteByApplication(Application application);
}
