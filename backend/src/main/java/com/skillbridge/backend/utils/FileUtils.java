package com.skillbridge.backend.utils;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@Component
@Slf4j
public class FileUtils {
    public static void cleanupTempFile(Path path) {
        if (path != null) {
            try {
                Files.deleteIfExists(path);
                log.debug("Deleted temporary file: {}", path.getFileName());
            } catch (IOException e) {
                log.warn("Failed to delete file {}: {}", path.getFileName(), e.getMessage());
            }
        }
    }
}