package com.skillbridge.backend.service;
import com.skillbridge.backend.entity.Category;
import com.skillbridge.backend.dto.request.CategoryProfessionRequest;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;


@Service

public class CategoryProfessionService {
    @Autowired
    CategoryRepository categoryProfession;
    public Category CreateCategoryProfession(CategoryProfessionRequest request) {
        Category category = new Category();
        if(categoryProfession.existsByName(request.getName())) {
            throw new AppException(ErrorCode.CATEGORY_PROFESSION);
        }
        category.setName(request.getName());
        return categoryProfession.save(category);
    }
    public Category getCategoryProfessionById(String id) {
        return categoryProfession.findById(id).orElseThrow( () -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
    }
    public List<Category> getAllCategoryProfessions() {
        return categoryProfession.findAll();
    }
    public Category UpdateCategoryProfession(String id,CategoryProfessionRequest request) {
        Category category = getCategoryProfessionById(id);
        if(categoryProfession.existsByName(request.getName())) {
            throw new AppException(ErrorCode.CATEGORY_PROFESSION);
        }
        category.setName(request.getName());
        return categoryProfession.save(category);
    }
    public Category deleteCategoryProfession(String id) {
        Category category = getCategoryProfessionById(id);
        categoryProfession.deleteById(id);
        return category;
    }

}
