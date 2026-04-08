package com.skillbridge.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 1. Lấy thư mục làm việc hiện tại (Working Directory)
        String userDir = System.getProperty("user.dir");

        // 2. Xác định đường dẫn tuyệt đối đến folder 'uploads'
        // Logic: Nếu đang đứng ở root SkillBridge thì cộng thêm /backend,
        // nếu đã đứng ở /backend thì dùng luôn.
        String uploadPath;
        if (userDir.endsWith("backend")) {
            uploadPath = userDir + "/uploads/";
        } else {
            uploadPath = userDir + "/backend/uploads/";
        }

        // Đảm bảo đường dẫn hợp lệ cho Spring (bắt đầu bằng file:)
        String finalPath = "file:" + uploadPath;

        // 3. Đăng ký các Resource Handler
        // Mapping /avatars/** -> uploads/avatars/
        registry.addResourceHandler("/avatars/**")
                .addResourceLocations(finalPath + "avatars/");

        // Mapping /logos/** -> uploads/logos/
        registry.addResourceHandler("/logos/**")
                .addResourceLocations(finalPath + "logos/");

        // Mapping /licenses/** -> uploads/licenses/
        registry.addResourceHandler("/licenses/**")
                .addResourceLocations(finalPath + "licenses/");

        // Mapping /CVs/** -> uploads/CVs/
        registry.addResourceHandler("/CVs/**")
                .addResourceLocations(finalPath + "CVs/");

        // 4. Log ra Console để bạn kiểm tra chính xác đường dẫn khi khởi động Server
        System.out.println("\n--- [STATIC RESOURCE CONFIG] ---");
        System.out.println("📍 Base Upload Path: " + finalPath);
        System.out.println("✅ Resource /logos/** mapped to: " + finalPath + "logos/");
        System.out.println("---------------------------------\n");
    }
}