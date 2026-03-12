package com.skillbridge.backend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
@Getter
@Setter
public class ZaloPayConfig {
    @Value("${ZALOPAY.AAPID}")
    private String apiAPPID;
    @Value("${ZALOPAY.KEY1}")
    private String key1;
    @Value("${ZALOPAY.KEY2}")
    private String key2;
    @Value("${ZALOPAY.ENDPOIND}")
    private String endpoint;



}
