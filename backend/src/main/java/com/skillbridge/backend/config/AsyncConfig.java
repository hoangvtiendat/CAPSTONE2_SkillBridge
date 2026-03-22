package com.skillbridge.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean(name = "taskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);      // Số lượng luồng tối thiểu luôn chạy
        executor.setMaxPoolSize(10);     // Số lượng luồng tối đa có thể tạo
        executor.setQueueCapacity(100);  // Hàng đợi cho các tác vụ chờ
        executor.setThreadNamePrefix("SkillBridgeAsync-");
        executor.initialize();
        return executor;
    }
}