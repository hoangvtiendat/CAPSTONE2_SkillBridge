package com.skillbridge.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Ánh xạ URL /logos/** vào thư mục vật lý uploads
        registry.addResourceHandler("/logos/**")
                .addResourceLocations("file:uploads/logos/");
        registry.addResourceHandler("/licenses/**")
                .addResourceLocations("file:uploads/licenses/");
        registry.addResourceHandler("/CVs/**")
                .addResourceLocations("file:uploads/CVs/");
    }
}