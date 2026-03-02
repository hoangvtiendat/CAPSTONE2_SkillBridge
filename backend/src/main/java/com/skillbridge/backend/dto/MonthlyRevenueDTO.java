package com.skillbridge.backend.dto;

import java.math.BigDecimal;

public class MonthlyRevenueDTO {
    private Integer month;
    private BigDecimal revenue;

    public MonthlyRevenueDTO(Integer month, BigDecimal revenue) {
        this.month = month;
        this.revenue = revenue;
    }

    public Integer getMonth() {
        return month;
    }

    public BigDecimal getRevenue() {
        return revenue;
    }
}
