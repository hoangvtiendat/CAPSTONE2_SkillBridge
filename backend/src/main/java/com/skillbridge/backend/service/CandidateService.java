package com.skillbridge.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillbridge.backend.dto.request.DegreeRequest;
import com.skillbridge.backend.dto.request.UpdateCandidateCvRequest;
import com.skillbridge.backend.dto.response.DegreeResponse;
import com.skillbridge.backend.dto.response.UpdateCandidateCvResponse;
import com.skillbridge.backend.entity.Candidate;
import com.skillbridge.backend.entity.Category;
import com.skillbridge.backend.entity.User;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.repository.CandidateRepository;
import com.skillbridge.backend.repository.CategoryRepository;
import com.skillbridge.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CandidateService {
    private final CandidateRepository candidateRepository;
    private final CategoryRepository categoryRepository;
    private final ObjectMapper objectMapper;
    private final UserRepository userRepository;

    public CandidateService(CandidateRepository candidateRepository, CategoryRepository categoryRepository,UserRepository userRepository, ObjectMapper objectMapper) {
        this.candidateRepository = candidateRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public UpdateCandidateCvResponse updateCv(String userId, UpdateCandidateCvRequest request) {
        try {
            // 1. Tìm Candidate theo userId. Nếu không thấy, thực hiện logic khởi tạo
            Candidate candidate = candidateRepository.findById(userId)
                    .orElseGet(() -> {
                        // Tìm User để đảm bảo userId này có tồn tại trong hệ thống
                        User user = userRepository.findById(userId)
                                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

                        // Tạo bản ghi Candidate mới
                        Candidate newCandidate = new Candidate();
                        newCandidate.setUser(user); // @MapsId sẽ tự lấy ID của user gán cho candidate
                        System.out.println("Creating new candidate profile for userId: " + userId);
                        return newCandidate;
                    });

            // ===== 2. CẬP NHẬT CÁC TRƯỜNG DỮ LIỆU =====
            if (request.getOpenToWork() != null)
                candidate.setOpenToWork(request.getOpenToWork());

            if (request.getYearsOfExperience() != null)
                candidate.setYearsOfExperience(request.getYearsOfExperience());

            if (request.getExpectedSalary() != null)
                candidate.setExpectedSalary(request.getExpectedSalary());

            // ===== CATEGORY =====
            if (request.getCategoryId() != null) {
                Category category = categoryRepository.findById(request.getCategoryId())
                        .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
                candidate.setCategory(category);
            }

            // ===== DEGREES JSON =====
            List<DegreeResponse> degreeResponses = null;
            if (request.getDegrees() != null) {
                validateDegrees(request.getDegrees());
                String degreesJson = objectMapper.writeValueAsString(request.getDegrees());
                candidate.setDegree(degreesJson);

                degreeResponses = request.getDegrees().stream()
                        .map(this::toDegreeResponse)
                        .toList();
            }

            // 3. Lưu (Hành động này sẽ INSERT nếu là mới, UPDATE nếu đã có)
            candidateRepository.save(candidate);

            // Trả về Response
            return new UpdateCandidateCvResponse(
                    candidate.getUser().getId(),
                    candidate.getOpenToWork(),
                    candidate.getYearsOfExperience(),
                    candidate.getExpectedSalary(),
                    candidate.getCategory() != null ? candidate.getCategory().getId() : null,
                    candidate.getCategory() != null ? candidate.getCategory().getName() : null,
                    degreeResponses
            );
        } catch (JsonProcessingException e) {
           System.out.println("Failed to serialize degrees JSON"+ e);
            throw new AppException(ErrorCode.INVALID_JSON_FORMAT);
        }
    }
    private DegreeResponse toDegreeResponse(DegreeRequest req) {
        DegreeResponse res = new DegreeResponse();
        res.setType(req.getType());
        res.setDegree(req.getDegree());
        res.setMajor(req.getMajor());
        res.setInstitution(req.getInstitution());
        res.setGraduationYear(req.getGraduationYear());
        res.setName(req.getName());
        res.setYear(req.getYear());
        return res;
    }

    private void validateDegrees(List<DegreeRequest> degrees) {

        for (DegreeRequest d : degrees) {

            if (d.getType() == null) {
                throw new AppException(ErrorCode.DEGREE_TYPE_REQUIRED);
            }

            switch (d.getType()) {
                case "DEGREE" -> {
                    if (d.getDegree() == null ||
                            d.getInstitution() == null ||
                            d.getGraduationYear() == null) {
                        throw new AppException(ErrorCode.INVALID_DEGREE);
                    }
                }
                case "CERTIFICATE" -> {
                    if (d.getName() == null || d.getYear() == null) {
                        throw new AppException(ErrorCode.INVALID_CERTIFICATE);
                    }
                }
                default -> throw new AppException(ErrorCode.INVALID_DEGREE_TYPE);
            }
        }
    }
}
