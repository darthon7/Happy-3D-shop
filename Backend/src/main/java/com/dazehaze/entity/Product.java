package com.dazehaze.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "base_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal basePrice;

    @Column(name = "sale_price", precision = 10, scale = 2)
    private BigDecimal salePrice;

    @Column(nullable = false, unique = true)
    private String slug;

    @Builder.Default
    @Column(name = "is_featured")
    private Boolean isFeatured = false;

    @Builder.Default
    @Column(name = "is_active")
    private Boolean isActive = true;

    @Builder.Default
    @Column(name = "is_new")
    private Boolean isNew = false;

    @Builder.Default
    @Column(name = "low_stock_threshold")
    private Integer lowStockThreshold = 5;

    // SEO fields
    @Column(name = "meta_title")
    private String metaTitle;

    @Column(name = "meta_description")
    private String metaDescription;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Shipping dimensions - Physical product measurements
    @Column(name = "weight_kg")
    private Double weightKg; // Weight in kilograms (e.g., 0.350)

    @Column(name = "length_cm")
    private Double lengthCm; // Length in centimeters (e.g., 30.00)

    @Column(name = "width_cm")
    private Double widthCm; // Width in centimeters (e.g., 25.00)

    @Column(name = "height_cm")
    private Double heightCm; // Height in centimeters (e.g., 2.50)

    // Relationships
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id")
    private Category category;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProductVariant> variants = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    @Builder.Default
    private List<ProductImage> images = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL)
    @Builder.Default
    private List<Review> reviews = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    @org.hibernate.annotations.Formula("COALESCE(sale_price, base_price)")
    private BigDecimal currentPrice;

    // Helper method to check if on sale
    public boolean isOnSale() {
        return salePrice != null && salePrice.compareTo(basePrice) < 0;
    }

    // Helper method to calculate discount percentage
    public Integer getDiscountPercentage() {
        if (!isOnSale())
            return 0;
        return basePrice.subtract(salePrice)
                .divide(basePrice, 2, java.math.RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .intValue();
    }
}
