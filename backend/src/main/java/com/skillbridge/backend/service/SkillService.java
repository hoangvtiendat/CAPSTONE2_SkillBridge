package com.skillbridge.backend.service;


import com.skillbridge.backend.dto.request.SkillRequest;
import com.skillbridge.backend.entity.Category;
import com.skillbridge.backend.entity.Skill;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.repository.JobSkillRepository;
import com.skillbridge.backend.repository.SkillRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
@Service
public class SkillService {
    @Autowired
    private SkillRepository skillRepository;
    @Autowired
    private CategoryProfessionService categoryProfessionService;
    @Autowired
    private JobSkillRepository jobSkillRepository;

    public Skill CreateNewSkill(SkillRequest skillRequest) {
        Skill skill = new Skill();
        // check trùng tên
        if(skillRepository.existsByName(skillRequest.getName())) {
            throw new AppException(ErrorCode.SKILL_EXITS_NAME);
        }

        skill.setName(skillRequest.getName());
        Category category = categoryProfessionService.getCategoryProfessionById(skillRequest.getCategory_id());
        skill.setCategory(category);
        return skillRepository.save(skill);
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
    public Skill UpdateSkill(String id, SkillRequest skillRequest) {
        Skill skill = getSkillById(id);
        if(skillRepository.existsByName(skillRequest.getName())) {
            throw new AppException(ErrorCode.SKILL_EXITS_NAME);
        }
        skill.setName(skillRequest.getName());
        Category category = categoryProfessionService.getCategoryProfessionById(skillRequest.getCategory_id());
        skill.setCategory(category);
        return skillRepository.save(skill);

    }
    public Skill deleteSkill(String id) {
        Skill skill = getSkillById(id);
        Boolean isDeleted = jobSkillRepository.existsBySkillId(id);
        if(isDeleted) {
            throw new AppException(ErrorCode.DUPLICATE_JOB_SKILL);
        }

        skillRepository.delete(skill);
        return skill;
    }

}
