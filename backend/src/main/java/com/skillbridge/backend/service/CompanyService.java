package com.skillbridge.backend.service;

import com.skillbridge.backend.dto.CompanyDTO;
import com.skillbridge.backend.dto.response.CompanyFeedItemResponse;
import com.skillbridge.backend.dto.response.CompanyFeedResponse;
import com.skillbridge.backend.enums.CompanyStatus;
import com.skillbridge.backend.repository.CompanyRepository;
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
        String cleanMst = mst.trim();
        System.out.println("\n" + "=".repeat(50));
        System.out.println("BẮT ĐẦU KIỂM TRA MST: [" + cleanMst + "]");
        System.out.println("===========================================");

        try {
            String searchUrl = "https://www.tratencongty.com/search/"+ cleanMst;
            System.out.println("-> Đang gửi POST request tới: " + searchUrl);

            Document searchDoc = Jsoup.connect(searchUrl)
                    .userAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36")
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .data("q", cleanMst) // 'q' là name của input trong image_342b92.png
                    .method(org.jsoup.Connection.Method.POST)
                    .timeout(15000)
                    .followRedirects(true)
                    .post();

            System.out.println("-> Tiêu đề trang sau POST: " + searchDoc.title());
            System.out.println("-> URL thực tế: " + searchDoc.location());

            if (searchDoc.location().contains("/company/")) {
                System.out.println("=> TRÌNH DUYỆT TỰ REDIRECT THẲNG VÀO TRANG CHI TIẾT.");
                return parseTraTenCongTy(searchDoc, cleanMst);
            }

            Element searchResults = searchDoc.selectFirst(".search-results");
            if (searchResults == null) {
                System.out.println("!!! KHÔNG THẤY KHỐI .search-results");
                String bodyText = searchDoc.body().text();
                System.out.println("-> Nội dung Body (snippet): " + (bodyText.length() > 300 ? bodyText.substring(0, 300) : bodyText));
                return null;
            }
            Element firstLink = searchDoc.selectFirst(".search-results a[href*='/company/']");

            if (firstLink != null) {
                String detailUrl = firstLink.absUrl("href");
                System.out.println("=> LẤY KẾT QUẢ ĐẦU TIÊN: " + detailUrl);

                Document detailDoc = Jsoup.connect(detailUrl)
                        .userAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36")
                        .get();
                return parseTraTenCongTy(detailDoc, cleanMst);
            } else {
                System.out.println("!!! KHÔNG TÌM THẤY BẤT KỲ KẾT QUẢ NÀO TRÊN TRANG.");
                String bodySnippet = searchDoc.body().text();
                System.out.println("-> Nội dung hiển thị: " + (bodySnippet.length() > 200 ? bodySnippet.substring(0, 200) : bodySnippet));
            }
        } catch (Exception e) {
            System.err.println("!!! LỖI TRONG QUÁ TRÌNH TRA CỨU: " + e.getMessage());
        }
        System.out.println("=".repeat(50) + "\n");
        return null;
    }

    private CompanyDTO parseTraTenCongTy(Document doc, String mst) {
        System.out.println("-> Bắt đầu bóc tách dữ liệu chính xác...");
        CompanyDTO dto = new CompanyDTO();

        Element jumbotron = doc.selectFirst(".jumbotron");
        if (jumbotron != null) {
            Element mainTitle = doc.selectFirst("h4, h1");
            if (mainTitle != null) {
                dto.setName(mainTitle.text().trim().toUpperCase());
            }
            Elements allBase64Imgs = jumbotron.select("img[src^=data:image]");
            Element mstLabel = jumbotron.getElementsContainingOwnText("Mã số thuế:").first();
            if (mstLabel != null && !allBase64Imgs.isEmpty()) {
                String src = allBase64Imgs.get(0).attr("src");
                dto.setTaxCodeImg(src);
                System.out.println("Đã trích xuất ảnh MST");
            }

            Element phoneLabel = jumbotron.getElementsContainingOwnText("Điện thoại").first();
            if (phoneLabel != null && allBase64Imgs.size() >= 2) {
                String phoneSrc = allBase64Imgs.get(1).attr("src");
                dto.setPhoneImg(phoneSrc);
                System.out.println("Đã trích xuất ảnh SĐT");
            }

            String rawHtml = jumbotron.html();
            String textLines = Jsoup.clean(rawHtml, "", org.jsoup.safety.Safelist.none()
                    .addTags("br")).replace("<br>", "\n");

            for (String line : textLines.split("\n")) {
                String cleanLine = line.trim();
                String lowerLine = cleanLine.toLowerCase();

                if (lowerLine.contains("tên giao dịch:")) {
                    String val = cleanLine.split(":", 2)[1].trim();
                    if (dto.getName() == null) dto.setName(val.toUpperCase());
                } else if (lowerLine.contains("địa chỉ:")) {
                    dto.setAddress(cleanLine.split(":", 2)[1].trim());
                } else if (lowerLine.contains("đại diện pháp luật:")) {
                    dto.setRepresentative(cleanLine.split(":", 2)[1].trim());
                } else if (lowerLine.contains("ngày cấp giấy phép:")) {
                    dto.setLicenseDate(cleanLine.split(":", 2)[1].trim());
                } else if (lowerLine.contains("ngày hoạt động:")) {
                    dto.setStartDate(cleanLine.split(":", 2)[1].trim());
                } else if (lowerLine.contains("trạng thái:")) {
                    dto.setStatus(cleanLine.split(":", 2)[1].trim());
                }
            }
        }
        System.out.println("Tên Công ty: " + dto.getName());
        System.out.println("Địa chỉ: " + dto.getAddress());
        System.out.println("Đại diện: " + dto.getRepresentative());
        System.out.println("Ngày cấp giấy phép: " + dto.getLicenseDate());
        System.out.println("Ngày hoạt động: " + dto.getStartDate());
        System.out.println("Trạng thái: " + dto.getStatus());

        return dto;
    }
}
