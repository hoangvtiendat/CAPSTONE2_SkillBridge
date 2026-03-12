package com.skillbridge.backend.service;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillbridge.backend.HMACUtil;
import com.skillbridge.backend.config.CustomUserDetails;
import com.skillbridge.backend.config.ZaloPayConfig;
import com.skillbridge.backend.entity.Company;
import com.skillbridge.backend.entity.SubcriptionOfCompany;
import com.skillbridge.backend.entity.SubscriptionPlan;
import com.skillbridge.backend.enums.CompanyRole;
import com.skillbridge.backend.exception.AppException;
import com.skillbridge.backend.exception.ErrorCode;
import com.skillbridge.backend.repository.CompanyMemberRepository;
import com.skillbridge.backend.repository.CompanyRepository;
import com.skillbridge.backend.repository.SubcriptionOfCompanyRepository;
import com.skillbridge.backend.repository.SubscriptionPlanRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.text.SimpleDateFormat;
import java.util.*;

@Service
public class ZaloPayService {

    private final ZaloPayConfig zaloPayConfig;
    private final CompanyRepository companyRepository;
    private final Map<String, String> config = new HashMap<>();

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();
    private final CompanyMemberRepository companyMemberRepository;
    private final SubcriptionOfCompanyRepository subcriptionOfCompanyRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;

    public ZaloPayService(ZaloPayConfig zaloPayConfig,
                          SubcriptionOfCompanyRepository subcriptionOfCompanyRepository,
                          CompanyRepository companyRepository,
                          CompanyMemberRepository companyMemberRepository,
                          SubscriptionPlanRepository subscriptionPlanRepository) {
        this.zaloPayConfig = zaloPayConfig;

        config.put("appid", zaloPayConfig.getApiAPPID());
        config.put("key1", zaloPayConfig.getKey1());
        config.put("key2", zaloPayConfig.getKey2());
        config.put("endpoint", zaloPayConfig.getEndpoint());
        this.companyMemberRepository = companyMemberRepository;
        this.companyRepository = companyRepository;
        this.subcriptionOfCompanyRepository = subcriptionOfCompanyRepository;
        this.subscriptionPlanRepository = subscriptionPlanRepository;
    }
    public String getCurrentTimeString(String format) {
        Calendar cal = new GregorianCalendar(TimeZone.getTimeZone("GMT+7"));
        SimpleDateFormat sdf = new SimpleDateFormat(format);
        sdf.setTimeZone(cal.getTimeZone());
        return sdf.format(cal.getTime());
    }
    public Map<String, Object> createOder(String idSub, int type) throws Exception {
        System.out.println(idSub);
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated() ||
                !(authentication.getPrincipal() instanceof CustomUserDetails)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        String userID = userDetails.getUserId();
        var recruiter = companyMemberRepository.findByUser_Id(userID)
                .orElseThrow(() -> new AppException(ErrorCode.MEMBER_NOT_FOUND));

        boolean isAdmin = recruiter.getRole() == CompanyRole.ADMIN;
        boolean isCompany = recruiter.getCompany() != null;
        if (!isAdmin && !isCompany) {
            throw new AppException(ErrorCode.EXITS_YOUR_ROLE);
        }
        Company company = companyRepository.findById(recruiter.getCompany().getId()).get();

        long amount = 0;

        if (type == 1) {
            SubcriptionOfCompany subcriptionOfCompany = subcriptionOfCompanyRepository
                    .findById(idSub)
                    .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND_SUBSCRIPTION));

            amount = subcriptionOfCompany.getPrice().longValue();

        } else if (type == 0) {
            SubscriptionPlan subscriptionPlan = subscriptionPlanRepository.findById(idSub)
                    .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND_SUBSCRIPTION));

            amount = subscriptionPlan.getPrice().longValue();
        } else {
            throw new IllegalArgumentException("Type không hợp lệ. Chỉ chấp nhận 1 hoặc 0");
        }


        Map<String, Object> embeddata = new HashMap<>();
        embeddata.put("merchantinfo", "Thanh toán dịch vụ SkillBridge");
        embeddata.put("company_id", company.getId());
        embeddata.put("company_name", company.getName());
        embeddata.put("redirecturl", "http://localhost:3000/company/subscriptions"); //// check nhớ đổi url ở đây (jikan ga nai)

        List<Map<String, Object>> items = new ArrayList<>();
        Map<String, Object> item = new HashMap<>();
        item.put("itemid", "skillbridge_service");
        item.put("itemname", "Nạp tiền/Thanh toán dịch vụ công ty " + company.getName());
        item.put("itemprice", amount);
        item.put("itemquantity", 1);
        items.add(item);

        String itemJSON = objectMapper.writeValueAsString(items);
        String embedJSON = objectMapper.writeValueAsString(embeddata);

        // toa pay load order
        Map<String, Object> order = new HashMap<>();
        order.put("appid", zaloPayConfig.getApiAPPID());
        order.put("apptransid", getCurrentTimeString("yyMMdd") + "_" + UUID.randomUUID().toString().replace("-", ""));
        order.put("apptime", System.currentTimeMillis());
        order.put("amount", amount);
        order.put("appuser", userID);
        order.put("description", "SkillBridge - Công ty " + company.getName() + " thanh toán");
        order.put("bankcode", "zalopayapp");
        order.put("item", itemJSON);
        order.put("embeddata", embedJSON);
        order.put("callback_url", "https://0fbc-118-69-73-134.ngrok-free.app/identity/subscription/callback");

        String dataToMac = order.get("appid") + "|" + order.get("apptransid") + "|" + order.get("appuser") + "|"
                + order.get("amount") + "|" + order.get("apptime") + "|" + order.get("embeddata") + "|" + order.get("item");
        String mac = HMACUtil.HMacHexStringEncode(HMACUtil.HMACSHA256, config.get("key1"), dataToMac);
        order.put("mac", mac);
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_FORM_URLENCODED);

        org.springframework.util.MultiValueMap<String, String> formData = new org.springframework.util.LinkedMultiValueMap<>();
        for (Map.Entry<String, Object> entry : order.entrySet()) {
            formData.add(entry.getKey(), entry.getValue().toString());
        }
        org.springframework.http.HttpEntity<org.springframework.util.MultiValueMap<String, String>> requestEntity =
                new org.springframework.http.HttpEntity<>(formData, headers);
        Map response = restTemplate.postForObject(config.get("endpoint"), requestEntity, Map.class);
        System.out.println("ZaloPay response: " + response);

        return response;
    }

    public String procssCallBack(String jsonStr) {
        try {
            JsonNode cbdata = objectMapper.readTree(jsonStr);
            String dataStr = cbdata.get("data").asText();
            String reqMac = cbdata.get("mac").asText();

            String realKey2 = config.get("key2");
            String mac = HMACUtil.HMacHexStringEncode(HMACUtil.HMACSHA256, realKey2, dataStr).toLowerCase();

            System.out.println("=== DEBUG ZALOPAY MAC ===");
            System.out.println("1. Key2 dang dung : [" + realKey2 + "]");
            System.out.println("2. DataStr        : [" + dataStr + "]");
            System.out.println("3. MAC nhan duoc  : [" + reqMac + "]");
            System.out.println("4. MAC tinh toan  : [" + mac + "]");
            System.out.println("=========================");

            ObjectNode result = objectMapper.createObjectNode();

            if (!reqMac.equalsIgnoreCase(mac)) {
                result.put("returncode", -1);
                result.put("returnmessage", "Mã xác thực không khớp");
            } else {
                JsonNode data = objectMapper.readTree(dataStr);
                String appTransId = data.has("app_trans_id") ? data.get("app_trans_id").asText() : data.get("apptransid").asText();

                System.out.println("SkillBridge: Thanh toán thành công cho đơn: " + appTransId);


                result.put("returncode", 1);
                result.put("returnmessage", "success");
            }

            return result.toString();

        } catch (Exception e) {
            e.printStackTrace();
            return "{\"returncode\": 0, \"returnmessage\": \"" + e.getMessage() + "\"}";
        }
    }
}