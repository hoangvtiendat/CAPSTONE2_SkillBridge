package com.skillbridge.backend.entity;

import com.skillbridge.backend.enums.CompanyStatus;
import com.skillbridge.backend.enums.SubscriptionPlanStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.validator.constraints.URL;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "companies",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = "tax_id")
        }
)
public class Company extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36)
    @Setter(AccessLevel.NONE)
    private String id;

    @NotBlank(message = "Tên công ty không được để trống")
    @Size(max = 255)
    @Column(nullable = false)
    private String name;

    @NotBlank(message = "Mã số thuế không được để trống")
    @Size(min = 10, max = 10, message = "Mã số thuế phải có đúng 10 ký tự")
    @Pattern(regexp = "^[0-9]{10}$", message = "Mã số thuế phải là 10 chữ số")
    @Column(name = "tax_id", nullable = false, unique = true)
    private String taxId;

    @Column(name = "business_license_url")
    private String businessLicenseUrl;

    @Column(name = "posting_duration")
    private int postingDuration;

    @Column(name = "image_url")
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CompanyStatus status;

    @Size(max = 2000)
    @Column(columnDefinition = "TEXT")
    private String description;

    @NotBlank(message = "Địa chỉ không được để trống")
    private String address;

    @URL(message = "Định dạng website không hợp lệ")
    @Column(name = "website_url")
    private String websiteUrl;

    @OneToMany(mappedBy = "company", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private List<SubscriptionOfCompany> subscriptions;

    /**
     * Lấy trạng thái gói dịch vụ hiện tại.
     */
    public SubscriptionPlanStatus getCurrentSubscriptionPlanName() {
        if (this.subscriptions == null || this.subscriptions.isEmpty()) {
            return SubscriptionPlanStatus.FREE;
        }

        return this.subscriptions.stream()
                .filter(sub -> Boolean.TRUE.equals(sub.getIsActive()))
                .findFirst()
                .map(sub -> sub.getSubscriptionPlan().getName())
                .orElse(SubscriptionPlanStatus.FREE);
    }


}