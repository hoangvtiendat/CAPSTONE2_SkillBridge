package com.skillbridge.backend.service;

import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import jakarta.annotation.PostConstruct;
import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;

@Service
public class OcrService {

    @Value("${TESSERACT_DATAPATH}")
    private String dataPath;

    @Value("${TESSERACT_LIBPATH}")
    private String libraryPath;

    public String scanFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_FILE_FORMAT);
        }
        System.setProperty("jna.library.path", libraryPath);

        File convFile = null;
        try {
            Path tempPath = Files.createTempFile("ocr_upload_", "_" + file.getOriginalFilename());
            convFile = tempPath.toFile();
            file.transferTo(convFile);

            Tesseract tesseract = new Tesseract();
            tesseract.setDatapath(dataPath);
            tesseract.setLanguage("vie+eng");

            System.out.println("--- Đang quét OCR với cấu hình từ ENV ---");
            return tesseract.doOCR(convFile).trim();

        } catch (TesseractException | IOException e) {
            System.err.println("Lỗi xử lý OCR: " + e.getMessage());
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        } finally {
            if (convFile != null && convFile.exists()) {
                convFile.delete();
            }
        }
    }
}