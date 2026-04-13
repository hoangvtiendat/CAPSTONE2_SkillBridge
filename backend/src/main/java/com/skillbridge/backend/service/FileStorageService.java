package com.skillbridge.backend.service;

import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.utils.DataParserUtils;
import com.skillbridge.backend.utils.SecurityUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Objects;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class FileStorageService {

    @Value("${file.upload-dir:uploads}")
    String uploadDir;

    Path rootLocation;

    final SecurityUtils securityUtils;
    final SystemLogService systemLog;

    @PostConstruct
    public void init() {
        try {
            String userDir = System.getProperty("user.dir");
            String targetDir = uploadDir; // mặc định là "uploads" lấy từ application.properties

            // Ép buộc thư mục uploads phải nằm trong thư mục backend/
            if (!userDir.endsWith("backend")) {
                targetDir = "backend/" + uploadDir;
            }

            this.rootLocation = Paths.get(targetDir).toAbsolutePath().normalize();
            Files.createDirectories(this.rootLocation);
            log.info("Thư mục lưu trữ file đã sẵn sàng: {}", this.rootLocation);
        } catch (IOException e) {
            log.error("Không thể khởi tạo thư mục lưu trữ: {}", e.getMessage());
            throw new RuntimeException("Could not initialize storage", e);
        }
    }

    /**
     * Lưu file vào thư mục gốc kèm timestamp
     */
    public String save(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_FILE_FORMAT);
        }

        try {
            String originalFileName = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
            String fileName = System.currentTimeMillis() + "_" + originalFileName;
            Path targetLocation = this.rootLocation.resolve(fileName);

            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return fileName;

        } catch (IOException e) {
            log.error("Lỗi khi lưu file: {}", e.getMessage());
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    /**
     * Lưu file vào sub-folder (ví dụ: /avatars, /resumes)
     */
    public String saveFile(MultipartFile file, String subFolder) {
        if (file == null || file.isEmpty() || DataParserUtils.isInvalid(subFolder)) {
            return null;
        }

        try {
            Path folderPath = this.rootLocation.resolve(subFolder).normalize();
            if (!Files.exists(folderPath)) {
                Files.createDirectories(folderPath);
            }

            String originalFileName = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
            String fileName = UUID.randomUUID().toString() + "_" + originalFileName;
            Path filePath = folderPath.resolve(fileName);

            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            return "/" + subFolder + "/" + fileName;

        } catch (IOException e) {
            log.error("Lỗi khi lưu file vào {}: {}", subFolder, e.getMessage());
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    /**
     * Xóa file khỏi hệ thống lưu trữ dựa trên đường dẫn lưu trong DB
     * @param fileUrl: Đường dẫn lưu trong DB (Ví dụ: /Avatars/uuid_name.jpg)
     */
    public void deleteFile(String fileUrl) {
        if (!StringUtils.hasText(fileUrl)) {
            return;
        }
        try {
            String relativePath = fileUrl.startsWith("/") ? fileUrl.substring(1) : fileUrl;
            Path filePath = this.rootLocation.resolve(relativePath).normalize();
            if (Files.exists(filePath) && filePath.startsWith(this.rootLocation)) {
                Files.delete(filePath);
                log.info("[FILE-STORAGE] Đã xóa file thành công: {}", filePath);
            } else {
                log.warn("[FILE-STORAGE] Không tìm thấy file để xóa hoặc đường dẫn không hợp lệ: {}", fileUrl);
            }
        } catch (IOException e) {
            log.error("[FILE-STORAGE] Lỗi khi xóa file {}: {}", fileUrl, e.getMessage());
        }
    }
}