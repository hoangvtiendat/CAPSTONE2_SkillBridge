package com.skillbridge.backend.repository;

import com.skillbridge.backend.entity.InterviewSlot;
import com.skillbridge.backend.enums.SlotStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterviewSlotRepository extends JpaRepository<InterviewSlot, String> {
    List<InterviewSlot> findAllByJobIdAndStatus(String jobId, SlotStatus status);

    List<InterviewSlot> findAllByJobId(String jobId);
}
