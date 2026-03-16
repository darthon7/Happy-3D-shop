package com.dazehaze.dto.admin;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
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
public class CreateProductRequest {

    @NotBlank(message = "Product name is required")
    private String name;

    private String description;
    private String shortDescription;

    @NotNull(message = "Base price is required")
    @Positive(message = "Price must be positive")
    private BigDecimal basePrice;

    private BigDecimal salePrice;

    @NotBlank(message = "Slug is required")
    private String slug;

    private Long categoryId;
    private Boolean isFeatured = false;
    private Boolean isNew = false;
    private Boolean isActive = true;
    private Integer lowStockThreshold = 5;

    // SEO
    private String metaTitle;
    private String metaDescription;

    // Shipping dimensions
    private Double weightKg; // Weight in kilograms
    private Double lengthCm; // Length in centimeters
    private Double widthCm; // Width in centimeters
    private Double heightCm; // Height in centimeters

    // Variants
    @Valid
    private List<VariantRequest> variants;

    // Images
    @Valid
    private List<ImageRequest> images;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VariantRequest {
        private Long id;
        @NotBlank(message = "SKU is required")
        private String sku;
        private String size;
        private String color;
        private String colorHex;
        private String material;
        @NotNull(message = "Stock is required")
        private Integer stock;
        private BigDecimal priceAdjustment;
        private Boolean isActive;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImageRequest {
        @NotBlank(message = "Image URL is required")
        private String url;
        private String altText;
        private Integer sortOrder;
        private Boolean isMain = false;
        private String mediaType = "IMAGE";
    }
}
