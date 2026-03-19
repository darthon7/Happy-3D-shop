package com.dazehaze.dto.product;

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
public class ProductListResponse {
    private Long id;
    private String name;
    private BigDecimal basePrice;
    private BigDecimal salePrice;
    private BigDecimal currentPrice;
    private String slug;
    private Boolean isFeatured;
    private Boolean isNew;
    private Boolean isOnSale;
    private Integer discountPercentage;
    private String mainImageUrl;
    private String categoryName;
    private Double averageRating;
    private Long reviewCount;
    private Boolean isLowStock;
    private List<String> availableMaterials;
    private List<ColorInfo> availableColors;
    private List<SimpleMaterial> materials;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ColorInfo {
        private String name;
        private String hex;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SimpleMaterial {
        private Long id;
        private String sku;
        private Integer stock;
    }
}
