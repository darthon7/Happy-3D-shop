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
public class ProductResponse {
    private Long id;
    private String name;
    private String description;
    private String shortDescription;
    private BigDecimal basePrice;
    private BigDecimal salePrice;
    private BigDecimal currentPrice;
    private String slug;
    private Boolean isFeatured;
    private Boolean isNew;
    private Boolean isActive;
    private Boolean isOnSale;
    private Integer discountPercentage;
    private String mainImageUrl;
    private CategoryInfo category;
    private List<VariantInfo> variants;
    private List<ImageInfo> images;
    private Double averageRating;
    private Long reviewCount;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryInfo {
        private Long id;
        private String name;
        private String slug;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VariantInfo {
        private Long id;
        private String sku;
        private String size;
        private String color;
        private String colorHex;
        private Integer stock;
        private BigDecimal finalPrice;
        private Boolean isLowStock;
        private Boolean isOutOfStock;
        private Boolean isActive;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImageInfo {
        private Long id;
        private String url;
        private String altText;
        private Boolean isMain;
        private String mediaType;
    }
}
