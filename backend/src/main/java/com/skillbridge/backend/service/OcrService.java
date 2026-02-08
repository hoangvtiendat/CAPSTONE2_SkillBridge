package com.skillbridge.backend.service;

import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import net.sourceforge.tess4j.Tesseract;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;

@Service
public class OcrService {
    public String scanFile(MultipartFile file) throws Exception {
        // 1. Chỉ định đường dẫn thư viện Native TRƯỚC khi khởi tạo Tesseract
        System.setProperty("jna.library.path", "C:\\Program Files\\Tesseract-OCR");

        // 2. Kiểm tra file trống
        if (file.isEmpty()) throw new AppException(ErrorCode.INVALID_FILE_FORMAT);

        // 3. Tạo file tạm an toàn hơn
        File convFile = File.createTempFile("ocr_upload_", "_" + file.getOriginalFilename());
        file.transferTo(convFile);

        try {
            Tesseract tesseract = new Tesseract();

            // Dùng đường dẫn tuyệt đối chuẩn Windows
            tesseract.setDatapath("C:\\Program Files\\Tesseract-OCR\\tessdata");
            tesseract.setLanguage("vie+eng");

            // Log để kiểm tra tiến trình
            System.out.println("--- Đang bắt đầu quét OCR cho file: " + convFile.getName());

            String result = tesseract.doOCR(convFile);

            // Nếu result vẫn rỗng, có thể do file PDF không có Ghostscript
            if (result == null || result.trim().isEmpty()) {
                System.out.println("警告: Tesseract trả về kết quả rỗng. Kiểm tra định dạng file!");
            }

            return result;
        } finally {
            // Luôn xóa file tạm dù thành công hay thất bại
            if (convFile.exists()) {
                convFile.delete();
            }
        }
    }
}
