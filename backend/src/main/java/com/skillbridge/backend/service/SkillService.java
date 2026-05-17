package com.skillbridge.backend.service;

import com.skillbridge.backend.config.CustomUserDetails;
import com.skillbridge.backend.dto.request.SkillRequest;
import com.skillbridge.backend.entity.Category;
import com.skillbridge.backend.entity.Skill;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.repository.JobSkillRepository;
import com.skillbridge.backend.repository.SkillRepository;
import com.skillbridge.backend.utils.SecurityUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SkillService {
    SkillRepository skillRepository;
    CategoryProfessionService categoryProfessionService;
    JobSkillRepository jobSkillRepository;
    SystemLogService systemLog;
    SecurityUtils securityUtils;
    SimpMessagingTemplate messagingTemplate;

    @Transactional
    public Skill CreateNewSkill(SkillRequest skillRequest) {
        if(skillRepository.existsByName(skillRequest.getName())) {
            throw new AppException(ErrorCode.SKILL_EXITS_NAME);
        }
        Skill skill = new Skill();
        skill.setName(skillRequest.getName().trim());
        Category category = categoryProfessionService.getCategoryProfessionById(skillRequest.getCategoryId());
        skill.setCategory(category);

        Skill savedSkill = skillRepository.save(skill);

        CustomUserDetails currentUser = securityUtils.getCurrentUser();
        systemLog.info(currentUser, "Admin tạo kỹ năng mới: " + savedSkill.getName());

        messagingTemplate.convertAndSend("/topic/skills", savedSkill);

        return savedSkill;
    }

    public List<Skill> getSkillsByCategory(String categoryId) {
        if(categoryProfessionService.getCategoryProfessionById(categoryId) == null) {
            throw new AppException(ErrorCode.CATEGORY_NOT_FOUND);
        }
        return skillRepository.findByCategory_Id(categoryId);
    }

    public Skill getSkillById(String id) {
        return skillRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.SKILL_NOT_FOUND));
    }

    @Transactional
    public Skill UpdateSkill(String id, SkillRequest request) {
        Skill skill = getSkillById(id);
        if (!skill.getName().equals(request.getName()) && skillRepository.existsByName(request.getName())) {
            throw new AppException(ErrorCode.SKILL_EXITS_NAME);
        }

        skill.setName(request.getName());
        Category category = categoryProfessionService.getCategoryProfessionById(request.getCategoryId());
        skill.setCategory(category);

        Skill updatedSkill = skillRepository.save(skill);

        CustomUserDetails currentUser = securityUtils.getCurrentUser();
        systemLog.warn(currentUser, "Admin cập nhật kỹ năng ID: " + request.getName() + " thành " + updatedSkill.getName());

        messagingTemplate.convertAndSend("/topic/skills", updatedSkill);

        return updatedSkill;
    }

    @Transactional
    public Skill deleteSkill(String id) {
        Skill skill = getSkillById(id);
        if(jobSkillRepository.existsBySkillId(id)) {
            throw new AppException(ErrorCode.DUPLICATE_JOB_SKILL);
        }
        skillRepository.delete(skill);
        CustomUserDetails currentUser = securityUtils.getCurrentUser();
        systemLog.danger(currentUser, "Admin xóa vĩnh viễn kỹ năng: " + skill.getName());
        messagingTemplate.convertAndSend("/topic/skills/delete", id);
        return skill;
    }

    public List<Skill> getAutocompleteSkills(String query, String category, Pageable pageable) {
        if (query == null || query.trim().isEmpty()) {
            return List.of();
        }
        return skillRepository.searchAutoSkill(query.trim(), category, pageable);
    }
}
