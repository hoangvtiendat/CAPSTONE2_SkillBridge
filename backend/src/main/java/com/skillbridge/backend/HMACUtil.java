package com.skillbridge.backend;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Slf4j
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class HMACUtil {

    public static final String HMAC_MD5 = "HmacMD5";
    public static final String HMAC_SHA1 = "HmacSHA1";
    public static final String HMAC_SHA256 = "HmacSHA256";
    public static final String HMAC_SHA512 = "HmacSHA512";

    private static byte[] hMacEncode(final String algorithm, final String key, final String data) {
        try {
            Mac mac = Mac.getInstance(algorithm);
            SecretKeySpec signingKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), algorithm);
            mac.init(signingKey);
            return mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            log.error("Lỗi khi mã hóa HMAC với thuật toán {}: ", algorithm, e);
            return null;
        }
    }

    public static String hMacBase64Encode(final String algorithm, final String key, final String data) {
        byte[] hmacBytes = hMacEncode(algorithm, key, data);
        return (hmacBytes == null) ? null : Base64.getEncoder().encodeToString(hmacBytes);
    }

    public static String hMacHexStringEncode(final String algorithm, final String key, final String data) {
        byte[] hmacBytes = hMacEncode(algorithm, key, data);
        if (hmacBytes == null) return null;

        StringBuilder sb = new StringBuilder(hmacBytes.length * 2);
        for (byte b : hmacBytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}