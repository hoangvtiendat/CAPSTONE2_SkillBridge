package com.skillbridge.backend.service;

import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;

@Service
public class OcrService {
    public String extractText(String filePath) {
        try {
            ProcessBuilder pb = new ProcessBuilder(
                    "tesseract",
                    filePath,
                    "stdout",
                    "-l", "vie+eng",
                    "--psm", "6"
            );
            Process process = pb.start();
            BufferedReader reader =
                    new BufferedReader(new InputStreamReader(process.getInputStream()));

            StringBuilder text = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                text.append(line).append("\n");
            }

            process.waitFor();
            return text.toString();

        } catch (Exception e) {
//            throw new AppException(ErrorCode.OCR_FAILED);
            throw new RuntimeException();
        }
    }
}
