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
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CompanyMemberService {
    private final CompanyMemberRepository companyMemberRepository;
    private final UserRepository userRepository;
    private final CompanyJoinRequestRepository companyJoinRequestRepository;
    public CompanyRole getRole(){
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        var memberRole = companyMemberRepository.findByUser_Id(userDetails.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return memberRole.getRole();
    }

    public List<CompanyMemberResponse> getMember(String userID){
        try{
            User user = userRepository.findById(userID)
                    .orElseThrow(()->new AppException(ErrorCode.USER_NOT_FOUND));
            List<CompanyMemberResponse> memberResponses = companyMemberRepository.getMemeber(userID);
            return memberResponses;
        }catch (Exception e){
            System.out.println("Lỗi khi lấy danh sách thành viên "+e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    public List<CompanyMemberResponse> getMemberPending(String userId){
        try{
            User user = userRepository.findById(userId)
                    .orElseThrow(()-> new AppException(ErrorCode.USER_NOT_FOUND));

            List<CompanyMemberResponse> memberPending = companyJoinRequestRepository.getJoinRequestOfMyCompany(userId);
            return memberPending;
        }catch(Exception e){
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }
}
