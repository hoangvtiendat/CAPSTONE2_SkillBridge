package com.skillbridge.backend.repository;

import com.skillbridge.backend.entity.Application;
import com.skillbridge.backend.entity.Interview;
import com.skillbridge.backend.entity.InterviewSlot;
import com.skillbridge.backend.enums.SlotStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface InterviewRepository extends JpaRepository<Interview, String> {
    boolean existsByApplicationId(String applicationId);

    void deleteByApplication(Application application);

    List<Interview> findAllByApplication_Job_IdAndStatus(String jobId, SlotStatus status);

    List<Interview> findAllByApplicationCandidateId(String candidateId);

    List<Interview> findAllBySlotJobId(String jobId);

    List<Interview> findAllBySlotId(String slotId);

    List<Interview> findAllBySlot(InterviewSlot interviewSlot);

    List<Interview> findAllBySlot_StartTimeBetween(LocalDateTime start, LocalDateTime end);

    Optional<Interview> findByApplicationId(String id);
}
