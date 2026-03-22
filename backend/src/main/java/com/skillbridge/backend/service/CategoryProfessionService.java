package com.skillbridge.backend.service;
import com.skillbridge.backend.config.CustomUserDetails;
import com.skillbridge.backend.entity.Category;
import com.skillbridge.backend.dto.request.CategoryProfessionRequest;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.repository.CategoryRepository;
import com.skillbridge.backend.utils.SecurityUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CategoryProfessionService {
    CategoryRepository categoryRepository;
    SystemLogService systemLog;
    SecurityUtils securityUtils;
    SimpMessagingTemplate messagingTemplate;

    /**
     * Tạo mới danh mục ngành nghề
     */
    @Transactional
    public Category createCategoryProfession(CategoryProfessionRequest request) {
        CustomUserDetails currentUser = securityUtils.getCurrentUser();
        try {
            if (categoryRepository.existsByName(request.getName())) {
                log.warn("[CATEGORY_CREATE] Tên danh mục đã tồn tại: {}", request.getName());
                throw new AppException(ErrorCode.CATEGORY_PROFESSION);
            }

            Category category = new Category();
            category.setName(request.getName());
            Category saved = categoryRepository.save(category);

            messagingTemplate.convertAndSend("/topic/categories", saved);

            systemLog.info(currentUser, "Admin tạo mới danh mục: " + saved.getName());
            return saved;

        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("[SYSTEM_ERROR] Lỗi tạo danh mục: ", e);
            systemLog.danger(currentUser, "Lỗi hệ thống khi tạo danh mục: " + e.getMessage());
            throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Lấy thông tin chi tiết danh mục
     */
    public Category getCategoryProfessionById(String id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("[CATEGORY_NOT_FOUND] Không tìm thấy ID: {}", id);
                    return new AppException(ErrorCode.CATEGORY_NOT_FOUND);
                });
    }

    /**
     * Lấy toàn bộ danh mục
     */
    public List<Category> getAllCategoryProfessions() {
        return categoryRepository.findAll();
    }

    /**
     * Cập nhật danh mục ngành nghề
     */
    @Transactional
    public Category updateCategoryProfession(String id, CategoryProfessionRequest request) {
        CustomUserDetails currentUser = securityUtils.getCurrentUser();
        try {
            Category category = getCategoryProfessionById(id);

            if (!category.getName().equalsIgnoreCase(request.getName()) &&
                    categoryRepository.existsByName(request.getName())) {
                log.warn("[CATEGORY_UPDATE] Trùng tên danh mục khi cập nhật: {}", request.getName());
                throw new AppException(ErrorCode.CATEGORY_PROFESSION);
            }

            String oldName = category.getName();
            category.setName(request.getName());
            Category updated = categoryRepository.save(category);

            messagingTemplate.convertAndSend("/topic/categories", updated);

            systemLog.info(currentUser, String.format("Cập nhật danh mục: [%s] -> [%s]", oldName, updated.getName()));
            return updated;

        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("[SYSTEM_ERROR] Lỗi cập nhật danh mục {}: ", id, e);
            systemLog.danger(currentUser, "Lỗi hệ thống khi cập nhật danh mục: " + e.getMessage());
            throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Xóa danh mục ngành nghề
     */
    @Transactional
    public Category deleteCategoryProfession(String id) {
        CustomUserDetails currentUser = securityUtils.getCurrentUser();
        Category category = getCategoryProfessionById(id);

        try {
            categoryRepository.deleteById(id);

            messagingTemplate.convertAndSend("/topic/categories/delete", id);

            systemLog.warn(currentUser, "Admin đã xóa danh mục: " + category.getName());
            return category;

        } catch (Exception e) {
            log.error("[SYSTEM_ERROR] Không thể xóa danh mục {}: ", id, e);
            systemLog.danger(currentUser, "Thất bại khi xóa danh mục (có thể do dữ liệu liên kết): " + category.getName());
            throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

}
