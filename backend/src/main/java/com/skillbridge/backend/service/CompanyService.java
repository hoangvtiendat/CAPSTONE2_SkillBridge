package com.skillbridge.backend.service;

import com.skillbridge.backend.dto.CompanyDTO;
import com.skillbridge.backend.dto.response.CompanyFeedItemResponse;
import com.skillbridge.backend.dto.response.CompanyFeedResponse;
import com.skillbridge.backend.enums.CompanyStatus;
import com.skillbridge.backend.repository.CompanyRepository;
import org.jsoup.Connection;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CompanyService {
    private final CompanyRepository companyRepository;

    public CompanyService(CompanyRepository companyRepository) {
        this.companyRepository = companyRepository;
    }

    public CompanyFeedResponse getCompanies(String cursor, CompanyStatus status, int limit) {
        Pageable pageable = PageRequest.of(0, limit + 1);
        List<CompanyFeedItemResponse> companies = companyRepository.getCompanyFeed(cursor, status, pageable);
        boolean hasMore = companies.size() > limit;
        String nextCursor = null;

        if (hasMore) {
            companies.remove(limit);
            nextCursor = companies.get(companies.size() - 1).getId();
        }
        return new CompanyFeedResponse(companies, nextCursor, hasMore);
    }
        public CompanyDTO lookupByTaxCode(String mst) {
        try {
//            String searchUrl = "https://masothue.com/Search/?q=" + mst + "+&type=auto";
//            System.out.println("URL truy vấn: " + searchUrl);
////            String directUrl = "https://masothue.com/" + mst + "-";
////            System.out.println("Truy cập URL trực tiếp: " + directUrl);
//
//            Connection.Response response = Jsoup.connect(searchUrl)
//                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
//                    .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8")
//                    .header("Accept-Language", "vi-VN,vi;q=0.9,en;q=0.8")
//                    .header("Sec-Ch-Ua", "\"Chromium\";v=\"122\", \"Not(A:Brand\";v=\"24\", \"Google Chrome\";v=\"122\"")
//                    .header("Sec-Ch-Ua-Mobile", "?0")
//                    .header("Sec-Ch-Ua-Platform", "\"Windows\"")
//                    .header("Sec-Fetch-Dest", "document")
//                    .header("Sec-Fetch-Mode", "navigate")
//                    .header("Sec-Fetch-Site", "none")
//                    .header("Sec-Fetch-User", "?1")
//                    .header("Upgrade-Insecure-Requests", "1")
//                    .header("Cookie", "tax_history=" + mst)
//                    .header("Referer", "https://masothue.com/")
//                    .followRedirects(true)
//                    .timeout(20000)
//                    .method(Connection.Method.GET)
//                    .execute();
            Connection.Response homeResponse = Jsoup.connect("https://masothue.com/")
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
                    .header("Accept-Language", "vi-VN,vi;q=0.9")
                    .method(Connection.Method.GET)
                    .timeout(10000)
                    .execute();

            // Lấy bộ Cookie vừa được cấp
            java.util.Map<String, String> cookies = homeResponse.cookies();

            // 2. GỌI URL SEARCH VỚI BỘ COOKIE MỚI
            // Tôi thêm dấu '+' sau MST như bạn mong muốn để ép server tìm kiếm mới
            String searchUrl = "https://masothue.com/Search/?q=" + mst + "+&type=auto";
            System.out.println("URL truy vấn: " + searchUrl);

            Connection.Response response = Jsoup.connect(searchUrl)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
                    .cookies(cookies) // Gửi kèm bộ cookie vừa nhận từ trang chủ
                    .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8")
                    .header("Referer", "https://masothue.com/")
                    .header("Upgrade-Insecure-Requests", "1")
                    .followRedirects(false)
                    .timeout(20000)
                    .method(Connection.Method.GET)
                    .execute();
            Document doc = response.parse();
            String finalUrl = doc.location();
            System.out.println("Đã nhảy tới URL: " + finalUrl);

            if (!finalUrl.contains(mst)) {
                System.err.println("Cảnh báo: Masothue tự động điều hướng sang công ty khác! (MST nhập: " + mst + ")");
                return null;
            }

            Element table = doc.selectFirst("table.table-taxinfo");
            if (table == null) {
                System.err.println("Không tìm thấy bảng thông tin chi tiết.");
                return null;
            }

            if (!table.text().contains(mst)) {
                System.err.println("Nội dung bảng không khớp với MST: " + mst);
                return null;
            }

            CompanyDTO dto = new CompanyDTO();
            dto.setTaxCode(mst);

            Element h1 = table.selectFirst("thead th h1");
            if (h1 != null) dto.setName(h1.text().toUpperCase());

            Elements rows = table.select("tbody tr");
            for (Element row : rows) {
                Elements cols = row.select("td");
                if (cols.size() < 2) continue;

                String label = cols.get(0).text().toLowerCase();
                Element valueCell = cols.get(1);

                if (label.contains("người đại diện")) {
                    Element rep = valueCell.selectFirst("a, span");
                    dto.setRepresentative(rep != null ? rep.text() : valueCell.text());
                } else if (label.contains("địa chỉ")) {
                    dto.setAddress(valueCell.text());
                } else if (label.contains("điện thoại")) {
                    dto.setPhone(valueCell.text().replace("Ẩn số điện thoại", "").trim());
                } else if (label.contains("ngày hoạt động")) {
                    dto.setStartDate(valueCell.text());
                } else if (label.contains("quản lý bởi")) {
                    dto.setManagedBy(valueCell.text());
                }
            }
            return dto;

        } catch (Exception e) {
            System.err.println("Lỗi cào dữ liệu: " + e.getMessage());
            return null;
        }
    }
}
