package com.skillbridge.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyDTO {

    @NotBlank(message = "Tên công ty không được để trống")
    private String name;

    @NotBlank(message = "Địa chỉ không được để trống")
    private String address;

    private String status;

    @NotBlank(message = "Người đại diện không được để trống")
    private String representative;

    private String startDate;

    private String licenseDate;

    @NotBlank(message = "Mã số thuế không được để trống")
    @Pattern(regexp = "^[0-9]{10,13}$", message = "Mã số thuế không hợp lệ")
    private String taxCode;

    private String phoneImg;
}