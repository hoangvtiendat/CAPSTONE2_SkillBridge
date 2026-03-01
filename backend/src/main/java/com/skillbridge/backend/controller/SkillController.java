package com.skillbridge.backend.controller;


import com.skillbridge.backend.dto.request.SkillRequest;
import com.skillbridge.backend.dto.response.ApiResponse;
import com.skillbridge.backend.entity.Skill;
import com.skillbridge.backend.service.SkillService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import java.util.List;

@RestController
@RequestMapping("/skill")
public class SkillController {
    @Autowired
    private SkillService skillService;
    @PostMapping("/set/create")
    public ResponseEntity<ApiResponse> createSkill(@RequestBody SkillRequest skillRequest) {
        Skill skill = skillService.CreateNewSkill(skillRequest);
        return ResponseEntity.ok(
                new ApiResponse<>(200,"Thêm kỹ năng mới thành công" , skill)
        );
    }
    @GetMapping("/list/{categoryId}")
    public ResponseEntity<ApiResponse> getSkillList(
            @PathVariable String categoryId) {

        List<Skill> skills = skillService.getSkillsByCategory(categoryId);

        return ResponseEntity.ok(
                new ApiResponse<>(200, "Lấy danh sách kỹ năng thành công", skills)
        );
    }
    @GetMapping("/{id}")
    public Skill getSkillById(@PathVariable String id) {
        return skillService.getSkillById(id);
    }
    @PutMapping("/set/Update/{id}")
    public ResponseEntity<ApiResponse> UpdateSkill(@PathVariable String id, @RequestBody SkillRequest skillRequest){
        Skill skill = skillService.UpdateSkill(id, skillRequest);
        return ResponseEntity.ok(
                new ApiResponse<>(200,"Update kỹ năng thành công ", skill)
        );
    }
    @DeleteMapping("/set/Delete/{id}")
    public ResponseEntity<ApiResponse> deleteSkill(@PathVariable String id) {
        Skill skill = skillService.deleteSkill(id);
        return ResponseEntity.ok(
                new ApiResponse<>(200,"Xóa kỹ năng thành công", skill)
        );
    }


}
