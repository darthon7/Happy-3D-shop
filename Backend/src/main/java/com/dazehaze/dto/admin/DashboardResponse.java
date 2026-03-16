package com.dazehaze.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {
    private BigDecimal totalRevenue;
    private BigDecimal todayRevenue;
    private BigDecimal monthRevenue;
    private Long totalOrders;
    private Long pendingOrders;
    private Long shippedOrders;
    private Long deliveredOrders;
    private Long totalProducts;
    private Long activeProducts;
    private Long lowStockProducts;
    private Long totalUsers;
    private List<TopProduct> topProducts;
    private List<RecentOrder> recentOrders;
    private List<DailySales> dailySales;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopProduct {
        private Long id;
        private String name;
        private String imageUrl;
        private Long totalSold;
        private BigDecimal revenue;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentOrder {
        private String orderNumber;
        private String customerName;
        private String status;
        private BigDecimal total;
        private String createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailySales {
        private String date;
        private BigDecimal revenue;
        private Long orders;
    }
}
