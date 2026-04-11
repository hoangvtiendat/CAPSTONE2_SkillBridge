package com.skillbridge.backend.service;

import com.skillbridge.backend.config.CustomUserDetails;
import com.skillbridge.backend.dto.request.BatchSlotRequest;
import com.skillbridge.backend.dto.request.SlotRequest;
import com.skillbridge.backend.dto.response.CandidateResponse;
import com.skillbridge.backend.dto.response.InterviewResponse;
import com.skillbridge.backend.dto.response.InterviewSlotResponse;
import com.skillbridge.backend.entity.*;
import com.skillbridge.backend.enums.InterviewStatus;
import com.skillbridge.backend.enums.SlotStatus;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.repository.ApplicationRepository;
import com.skillbridge.backend.repository.InterviewRepository;
import com.skillbridge.backend.repository.InterviewSlotRepository;
import com.skillbridge.backend.repository.JobRepository;
import com.skillbridge.backend.utils.SecurityUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class InterviewService {

    InterviewSlotRepository slotRepository;
    InterviewRepository interviewRepository;
    ApplicationRepository applicationRepository;
    JobRepository jobRepository;
    SystemLogService logService;
    SecurityUtils securityUtils;
    NotificationService notificationService;
    SimpMessagingTemplate messagingTemplate;
    CandidateService candidateService;
    @Transactional
    public List<InterviewSlotResponse> createBatchSlots(BatchSlotRequest request) {
        CustomUserDetails currentUser = securityUtils.getCurrentUser();

        Job job = jobRepository.findById(request.getJobId())
                .orElseThrow(() -> new AppException(ErrorCode.JOB_NOT_FOUND));

        List<InterviewSlot> slots = request.getSlots().stream().map(s ->
            InterviewSlot.builder()
                .job(job)
                .startTime(s.getStartTime())
                .endTime(s.getEndTime())
                .description(s.getDescription() != null && !s.getDescription().isBlank()
                        ? s.getDescription() : request.getDescription())
                .locationLink(s.getLocationLink() != null && !s.getLocationLink().isBlank()
                        ? s.getLocationLink() : request.getLocationLink())
                .capacity(s.getCapacity() != null ? s.getCapacity() : request.getDefaultCapacity())
                .currentOccupancy(0)
                .status(SlotStatus.AVAILABLE)
                .build()
        ).collect(Collectors.toList());

        List<InterviewSlot> savedSlots = slotRepository.saveAll(slots);
        logService.info(currentUser, "Đã tạo " + savedSlots.size() + " khung giờ cho: " + job.getPosition());

        List<Application> applicants = applicationRepository.findByJob_Id(job.getId());
        List<Application> pendingApplicants = applicants.stream()
                .filter(app -> !interviewRepository.existsByApplicationId(app.getId()))
                .toList();

        String notificationMessage = String.format("Có khung giờ phỏng vấn mới cho vị trí: %s", job.getPosition());

        pendingApplicants.forEach(app -> {
            notificationService.createNotification(
                app.getCandidate().getUser(),
                null,
                "Công ti "+ job.getCompany().getName() +" mà bạn ứng tuyển đã cập nhật lịch",
                notificationMessage,
                "INTERVIEW_UPDATE",
                "/candidate/jobs/" + job.getId(),
                true
            );
        });

        messagingTemplate.convertAndSend("/topic/job-slots/" + job.getId(), "UPDATE");

        return savedSlots.stream().map(this::mapToSlotResponse).toList();
    }

    public List<InterviewSlotResponse> getAllSlotsByJob(String jobId) {
        return slotRepository.findAllByJobId(jobId).stream()
                .map(this::mapToSlotResponse).toList();
    }

    public List<InterviewSlotResponse> getAvailableSlotsByJob(String jobId) {
        return slotRepository.findAllByJobIdAndStatus(jobId, SlotStatus.AVAILABLE).stream()
                .filter(s -> s.getStartTime().isAfter(LocalDateTime.now()))
                .map(this::mapToSlotResponse).toList();
    }

    public List<InterviewResponse> getMyInterviews() {
        String userId = securityUtils.getCurrentUser().getUserId();
        return interviewRepository.findAllByApplicationCandidateId(userId).stream()
                .map(this::mapToInterviewResponse)
                .toList();
    }

    @Transactional
    public InterviewSlotResponse updateSlot(String slotId, SlotRequest request) {
        InterviewSlot slot = slotRepository.findById(slotId)
                .orElseThrow(() -> new AppException(ErrorCode.SLOT_NOT_FOUND));

        // Logic chặn sửa nếu sát 12h
        if (slot.getStartTime().isBefore(LocalDateTime.now().plusHours(12))) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        LocalDateTime oldTime = slot.getStartTime();

        slot.setStartTime(request.getStartTime());
        slot.setEndTime(request.getEndTime());
        slot.setDescription(request.getDescription());
        slot.setLocationLink(request.getLocationLink());

        if (request.getCapacity() != null) {
            if (request.getCapacity() < slot.getCurrentOccupancy()) {
                throw new AppException(ErrorCode.INVALID_KEY);
            }
            slot.setCapacity(request.getCapacity());
            slot.setStatus(slot.getCurrentOccupancy() >= slot.getCapacity() ? SlotStatus.FULL : SlotStatus.AVAILABLE);
        }

        InterviewSlot updated = slotRepository.save(slot);

        if (slot.getCurrentOccupancy() > 0) {
            List<Interview> bookedInterviews = interviewRepository.findAllBySlotId(slotId);
            String message = String.format("Lịch phỏng vấn vị trí %s đã được thay đổi. Thời gian mới: %s",
                    slot.getJob().getPosition(), updated.getStartTime());

            bookedInterviews.forEach(interview -> {
                notificationService.createNotification(
                    interview.getApplication().getCandidate().getUser(),
                    null,
                    "Cập nhật lịch phỏng vấn",
                    message,
                    "INTERVIEW_UPDATE",
                    "/candidate/my-interviews",
                    true
                );
            });
        }

        messagingTemplate.convertAndSend("/topic/job-slots/" + slot.getJob().getId(), "UPDATE");
        return mapToSlotResponse(updated);
    }

    @Transactional
    public InterviewSlotResponse toggleLockSlot(String slotId, boolean lock) {
        CustomUserDetails currentUser = securityUtils.getCurrentUser();
        InterviewSlot slot = slotRepository.findById(slotId)
                .orElseThrow(() -> new AppException(ErrorCode.SLOT_NOT_FOUND));
        if (slot.getStartTime().isBefore(LocalDateTime.now())) {
            throw new AppException(ErrorCode.SLOT_EXPIRED);
        }

        if (lock) {
            slot.setStatus(SlotStatus.LOCKED);
            logService.info(currentUser, "Đã khóa khung giờ: " + slot.getStartTime());
        } else {
            slot.setStatus(slot.getCurrentOccupancy() >= slot.getCapacity()
                    ? SlotStatus.FULL : SlotStatus.AVAILABLE);
            logService.info(currentUser, "Đã mở khóa khung giờ: " + slot.getStartTime());
        }

        InterviewSlot updated = slotRepository.save(slot);
        messagingTemplate.convertAndSend("/topic/job-slots/" + slot.getJob().getId(), "UPDATE");

        return mapToSlotResponse(updated);
    }

    @Transactional
    public void deleteSlot(String slotId) {
        InterviewSlot slot = slotRepository.findById(slotId)
                .orElseThrow(() -> new AppException(ErrorCode.SLOT_NOT_FOUND));
        if (slot.getCurrentOccupancy() > 0) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }

        if (slot.getStartTime().isBefore(LocalDateTime.now().plusHours(12))) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        slotRepository.delete(slot);
        messagingTemplate.convertAndSend("/topic/job-slots/" + slot.getJob().getId(), "UPDATE");
    }

    @Transactional
    public InterviewResponse bookInterview(String slotId) {
        CustomUserDetails currentUser = securityUtils.getCurrentUser();
        String userId = currentUser.getUserId();

        InterviewSlot slot = slotRepository.findById(slotId)
                .orElseThrow(() -> new AppException(ErrorCode.SLOT_NOT_FOUND));

        if (slot.isFull() || slot.getStatus() == SlotStatus.FULL) {
            throw new AppException(ErrorCode.SLOT_ALREADY_BOOKED);
        }
        if (slot.getStatus() == SlotStatus.LOCKED) {
            throw new AppException(ErrorCode.SLOT_IS_LOCKED);
        }

        if (slot.getStartTime().isBefore(LocalDateTime.now())) {
            throw new AppException(ErrorCode.SLOT_EXPIRED);
        }

        Application app = applicationRepository.findByCandidateIdAndJobId(userId, slot.getJob().getId())
                .orElseThrow(() -> new AppException(ErrorCode.APPLICATION_NOT_FOUND));

        if (interviewRepository.existsByApplicationId(app.getId())) {
            throw new AppException(ErrorCode.INTERVIEW_ALREADY_SCHEDULED);
        }

        slot.setCurrentOccupancy(slot.getCurrentOccupancy() + 1);
        if (slot.getCurrentOccupancy() >= slot.getCapacity()) {
            slot.setStatus(SlotStatus.FULL);
        }
        slotRepository.save(slot);

        Interview interview = Interview.builder()
                .application(app)
                .slot(slot)
                .locationLink(slot.getLocationLink())
                .status(InterviewStatus.CONFIRMED)
                .build();

        Interview savedInterview = interviewRepository.save(interview);

        messagingTemplate.convertAndSend("/topic/job-slots/" + slot.getJob().getId(), "UPDATE");

        notificationService.createNotification(
                app.getCandidate().getUser(),
                null,
                "Đặt lịch thành công",
                "Bạn đã đặt lịch lúc " + slot.getStartTime() +" với vị trí "+ slot.getJob().getPosition()+" của công ti "+slot.getJob().getCompany().getName(),
                "INTERVIEW_BOOKED",
                "/candidate/my-interviews",
                true
        );

        return mapToInterviewResponse(savedInterview);
    }

    public List<CandidateResponse> getCandidatesInSlot(String slotId) {
        InterviewSlot slot = slotRepository.findById(slotId)
                .orElseThrow(() -> new AppException(ErrorCode.SLOT_NOT_FOUND));

        List<Interview> interviews = interviewRepository.findAllBySlot(slot);
        return interviews.stream()
                .map(interview -> {
                    Candidate candidate = interview.getApplication().getCandidate();
                    return candidateService.mapToCandidateResponse(candidate);
                })
                .toList();
    }

    // --- MAPPERS ---
    private InterviewResponse mapToInterviewResponse(Interview interview) {
        return InterviewResponse.builder()
                .id(interview.getId())
                .jobId(interview.getSlot().getJob().getId())
                .candidateId(interview.getApplication().getCandidate().getId())
                .jobPosition(interview.getSlot().getJob().getPosition())
                .startTime(interview.getSlot().getStartTime())
                .locationLink(interview.getSlot().getLocationLink())
                .description(interview.getSlot().getDescription())
                .status(interview.getStatus().name())
                .build();
    }

    private InterviewSlotResponse mapToSlotResponse(InterviewSlot slot) {
        String status = slot.getStatus().name();
        if (slot.getStartTime().isBefore(LocalDateTime.now())) {
            status = "EXPIRED";
        }
        return InterviewSlotResponse.builder()
                .id(slot.getId())
                .jobId(slot.getJob().getId())
                .startTime(slot.getStartTime())
                .endTime(slot.getEndTime())
                .capacity(slot.getCapacity())
                .currentOccupancy(slot.getCurrentOccupancy())
                .locationLink(slot.getLocationLink())
                .description(slot.getDescription())
                .status(status)
                .build();
    }
}