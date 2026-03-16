package com.dazehaze.dto.user;

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
public class WishlistResponse {
    private List<WishlistItem> items;
    private int totalItems;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WishlistItem {
        private Long productId;
        private String productName;
        private String productSlug;
        private String imageUrl;
        private BigDecimal price;
        private BigDecimal salePrice;
        private Boolean isOnSale;
        private Boolean inStock;
    }
}
