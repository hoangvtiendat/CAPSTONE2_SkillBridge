package com.skillbridge.backend.service;

import com.skillbridge.backend.config.CustomUserDetails;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.utils.SecurityUtils;
import jakarta.annotation.PostConstruct;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OcrService {

    @Value("${TESSERACT_DATAPATH}")
    String dataPath;

    @Value("${TESSERACT_LIBPATH:}")
    String libraryPath;

    final SecurityUtils securityUtils;
    final SystemLogService systemLog;

    Tesseract tesseract;

    @PostConstruct
    public void init() {
        if (libraryPath != null && !libraryPath.isBlank()) {
            System.setProperty("jna.library.path", libraryPath.trim());
            log.info("OCR Native Library Path set to: {}", libraryPath);
        }

        tesseract = new Tesseract();
        tesseract.setDatapath(dataPath);
        tesseract.setLanguage("vie+eng");
        tesseract.setPageSegMode(1);
        log.info("Tesseract OCR initialized with data path: {}", dataPath);
    }

    /**
     * Quét nội dung văn bản từ file (Hỗ trợ CV, tài liệu định dạng hình ảnh/PDF)
     */
    public String scanFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_FILE_FORMAT);
        }

        CustomUserDetails currentUser = securityUtils.getCurrentUser();

        Path tempPath = null;
        try {
            tempPath = Files.createTempFile("skillbridge_ocr_", "_" + file.getOriginalFilename());
            file.transferTo(tempPath.toFile());

            log.info("Starting OCR scan for file: {} by user: {}", file.getOriginalFilename(), currentUser.getUsername());
            long startTime = System.currentTimeMillis();

            String result = tesseract.doOCR(tempPath.toFile()).trim();

            long duration = System.currentTimeMillis() - startTime;
            log.info("OCR completed in {}ms for file {}", duration, file.getOriginalFilename());

            systemLog.info(currentUser, currentUser.getEmail() + " - Thực hiện OCR quét tài liệu: " + file.getOriginalFilename());

            return result;

        } catch (TesseractException e) {
            log.error("Tesseract Engine Error: {}", e.getMessage());
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        } catch (IOException e) {
            log.error("File IO Error during OCR: {}", e.getMessage());
            throw new AppException(ErrorCode.INVALID_FILE_FORMAT);
        } finally {
            cleanup(tempPath);
        }
    }

    private void cleanup(Path path) {
        if (path != null) {
            try {
                Files.deleteIfExists(path);
                log.debug("Temporary OCR file deleted: {}", path);
            } catch (IOException e) {
                log.warn("Failed to delete temporary OCR file: {}", path);
            }
        }
    }
}