package com.skillbridge.backend.service;

import com.skillbridge.backend.config.CustomUserDetails;
import com.skillbridge.backend.dto.response.CompanyMemberResponse;
import com.skillbridge.backend.entity.CompanyMember;
import com.skillbridge.backend.entity.User;
import com.skillbridge.backend.enums.CompanyRole;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.repository.CompanyJoinRequestRepository;
import com.skillbridge.backend.repository.CompanyMemberRepository;
import com.skillbridge.backend.repository.UserRepository;
import com.skillbridge.backend.utils.SecurityUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CompanyMemberService {
    CompanyMemberRepository companyMemberRepository;
    UserRepository userRepository;
    CompanyJoinRequestRepository companyJoinRequestRepository;
    SystemLogService systemLog;
    SecurityUtils securityUtils;
    SimpMessagingTemplate messagingTemplate;

    /**
     * Lấy vai trò (Role) của người dùng hiện tại trong công ty.
     */
    public CompanyRole getRole() {
        CustomUserDetails currentUser = securityUtils.getCurrentUser();
        try {
            return companyMemberRepository.findByUser_Id(currentUser.getUserId())
                    .map(CompanyMember::getRole)
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        } catch (AppException e) {
            log.warn("[ROLE_CHECK] Không tìm thấy vai trò cho user: {}", currentUser.getUserId());
            throw e;
        } catch (Exception e) {
            log.error("[SYSTEM_ERROR] Lỗi khi kiểm tra Role: ", e);
            systemLog.danger(currentUser, "Lỗi hệ thống khi truy vấn vai trò người dùng: " + e.getMessage());
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    /**
     * Lấy danh sách thành viên chính thức của công ty.
     * */
    public List<CompanyMemberResponse> getMember(String userID) {
        CustomUserDetails currentUser = securityUtils.getCurrentUser();
        try {
            userRepository.findById(userID)
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

            List<CompanyMemberResponse> memberResponses = companyMemberRepository.getMembers(userID);

            return memberResponses;
        } catch (AppException e) {
            log.warn("[MEMBER_LIST] Lỗi nghiệp vụ: {}", e.getErrorCode().getMessage());
            throw e;
        } catch (Exception e) {
            log.error("[SYSTEM_ERROR] Thất bại khi lấy danh sách thành viên cho user {}: ", userID, e);
            systemLog.danger(currentUser, "Lỗi hệ thống khi tải danh sách thành viên công ty: " + e.getMessage());
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    /**
     * Lấy danh sách các yêu cầu gia nhập đang chờ duyệt (Pending).
     * Tích hợp Realtime để UI biết khi nào cần làm mới danh sách.
     */
    public List<CompanyMemberResponse> getMemberPending(String userId) {
        CustomUserDetails currentUser = securityUtils.getCurrentUser();
        try {
            userRepository.findById(userId)
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

            List<CompanyMemberResponse> memberPending = companyJoinRequestRepository.getJoinRequestOfMyCompany(userId);

            return memberPending;
        } catch (AppException e) {
            log.warn("[PENDING_LIST] Lỗi: {}", e.getErrorCode().getMessage());
            throw e;
        } catch (Exception e) {
            log.error("[SYSTEM_ERROR] Lỗi truy vấn yêu cầu gia nhập cho user {}: ", userId, e);
            systemLog.danger(currentUser, "Lỗi hệ thống khi tải danh sách chờ duyệt: " + e.getMessage());
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }
}
