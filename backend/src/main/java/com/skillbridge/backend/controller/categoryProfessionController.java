package com.skillbridge.backend.controller;


import com.skillbridge.backend.dto.request.CategoryProfessionRequest;
import com.skillbridge.backend.entity.Category;
import com.skillbridge.backend.service.CategoryProfessionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.skillbridge.backend.dto.response.ApiResponse;

import java.util.List;

@RestController
@RequestMapping("/CategoryProfession")
public class categoryProfessionController {
    @Autowired
    private CategoryProfessionService categoryProfessionService;

    @PostMapping("/Create")
    public ResponseEntity<ApiResponse> createCategoryProfession(@RequestBody CategoryProfessionRequest request) {
        Category category = categoryProfessionService.CreateCategoryProfession(request);
        return ResponseEntity.ok(
                new ApiResponse<>(200,"Thêm lĩnh vực thành công ", category)
        );
    }
    @GetMapping("/{id}")
    Category GetCategoryProfession(@PathVariable String id) {
        return categoryProfessionService.getCategoryProfessionById(id);
    }
    @GetMapping("/listCategory")
    List<Category> GetAllCategoryProfessions() {
        return categoryProfessionService.getAllCategoryProfessions();
    }
    @PutMapping("/Update/{id}")
    public ResponseEntity<ApiResponse<Category>> updateCategoryProfession(
            @PathVariable String id,
            @RequestBody CategoryProfessionRequest request) {

        Category updated = categoryProfessionService
                .UpdateCategoryProfession(id, request);

        return ResponseEntity.ok(
                new ApiResponse<>(200, "Update tên lĩnh vữc thành công", updated)
        );
    }
    @DeleteMapping("/Delete/{id}")
    public ResponseEntity<ApiResponse> deleteCategoryProfession(@PathVariable String id) {
            Category catagory = categoryProfessionService.deleteCategoryProfession(id);
            return ResponseEntity.ok(
                    new ApiResponse<>(200,"Xóa lĩnh vữc thành công", catagory)
            );
    }

}
