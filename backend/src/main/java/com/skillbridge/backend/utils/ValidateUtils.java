package com.skillbridge.backend.utils;

import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import org.springframework.stereotype.Component;

@Component
public class ValidateUtils {
    public void validateTaxId(String taxId) {
        if (taxId == null || !taxId.trim().matches("^[0-9]{10}$")) {
            throw new AppException(ErrorCode.INVALID_TAX_ID);
        }
    }
}
