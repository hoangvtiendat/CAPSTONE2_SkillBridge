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
    public static String cleanJsonString(String text) {
        if (text == null || text.isBlank()) return "{}";
        String cleaned = text.trim();
        String codeFenceRegex = "```(?:json)?\\s*([\\s\\S]*?)\\s*```";
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(codeFenceRegex, java.util.regex.Pattern.CASE_INSENSITIVE);
        java.util.regex.Matcher matcher = pattern.matcher(cleaned);

        if (matcher.find()) {
            cleaned = matcher.group(1).trim();
        }
        cleaned = cleaned.replaceAll("\\\\end\\{[^}]*}", "");
        cleaned = cleaned.replaceAll("\\\\begin\\{[^}]*}", "");
        int firstBrace = Math.min(
                cleaned.indexOf('{') >= 0 ? cleaned.indexOf('{') : Integer.MAX_VALUE,
                cleaned.indexOf('[') >= 0 ? cleaned.indexOf('[') : Integer.MAX_VALUE
        );
        if (firstBrace != Integer.MAX_VALUE && firstBrace > 0) {
            cleaned = cleaned.substring(firstBrace);
        }

        int lastBrace = Math.max(
                cleaned.lastIndexOf('}'),
                cleaned.lastIndexOf(']')
        );
        if (lastBrace > 0) {
            cleaned = cleaned.substring(0, lastBrace + 1);
        }

        return cleaned.trim();
    }
    public static String ensureValidJson(String json) {
        json = json.trim();
        int braces = 0;
        int brackets = 0;

        for (char c : json.toCharArray()) {
            if (c == '{') braces++;
            else if (c == '}') braces--;
            else if (c == '[') brackets++;
            else if (c == ']') brackets--;
        }

        StringBuilder fixedJson = new StringBuilder(json);
        while (brackets > 0) {
            fixedJson.append("]");
            brackets--;
        }
        while (braces > 0) {
            fixedJson.append("}");
            braces--;
        }
        return fixedJson.toString();
    }


}