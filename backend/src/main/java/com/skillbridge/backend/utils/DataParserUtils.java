package com.skillbridge.backend.utils;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;

@Component
@Slf4j
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class DataParserUtils {

    /**
     * Kiểm tra chuỗi có hợp lệ hay không (loại bỏ null, empty, "undefined")
     */
    public static boolean isInvalid(String value) {
        return value == null || value.isBlank() ||
                value.equalsIgnoreCase("null") ||
                value.equalsIgnoreCase("undefined");
    }

    /**
     * Parse chuỗi sang Enum bất kỳ một cách an toàn
     */
    public static <E extends Enum<E>> E parseEnum(Class<E> enumClass, String value) {
        if (isInvalid(value)) return null;
        try {
            return Enum.valueOf(enumClass, value.toUpperCase().trim());
        } catch (IllegalArgumentException e) {
            log.warn("Invalid enum value [{}] for class [{}]. Returning null.", value, enumClass.getSimpleName());
            return null;
        }
    }

    /**
     * Parse chuỗi sang LocalDate (định dạng YYYY-MM-DD)
     */
    public static LocalDate parseLocalDate(String dateStr) {
        if (isInvalid(dateStr)) return null;
        try {
            return LocalDate.parse(dateStr.trim());
        } catch (DateTimeParseException e) {
            log.warn("Invalid date format [{}]. Expected YYYY-MM-DD. Returning null.", dateStr);
            return null;
        }
    }

    /**
     * Xử lý chuỗi trả về, loại bỏ Markdown code blocks nếu có
     */
    public static String cleanJson(String raw) {
        if (raw == null || raw.isBlank()) return "{}";
        String cleaned = raw.replaceAll("(?s)```json(.*?)```", "$1").trim();

        int firstBrace = cleaned.indexOf("{");
        int lastBrace = cleaned.lastIndexOf("}");

        if (firstBrace >= 0 && lastBrace >= 0 && lastBrace > firstBrace) {
            return cleaned.substring(firstBrace, lastBrace + 1);
        }
        return cleaned;
    }
}