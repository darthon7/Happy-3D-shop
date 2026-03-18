package com.dazehaze.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "product_variants")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String sku;

    private String color;

    @Column(name = "color_hex")
    private String colorHex;

    private String material;

    @Builder.Default
    @Column(nullable = false)
    private Integer stock = 0;

    @Builder.Default
    @Column(name = "price_adjustment", precision = 10, scale = 2)
    private BigDecimal priceAdjustment = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "estimated_print_minutes")
    private Integer estimatedPrintMinutes;

    @Column(name = "weight_grams")
    private Integer weightGrams;

    @Column(name = "infill_options")
    private String infillOptions;

    @Column(name = "layer_height_options")
    private String layerHeightOptions;

    @Column(name = "requires_support")
    private Boolean requiresSupport = false;

    @Column(name = "post_processing")
    private String postProcessing;

    @Column(name = "dimensional_accuracy")
    private String dimensionalAccuracy;

    @Column(name = "print_technology")
    private String printTechnology;

    @Column(name = "stl_specs", columnDefinition = "TEXT")
    private String stlSpecs;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    public BigDecimal getFinalPrice() {
        BigDecimal basePrice = product.getCurrentPrice();
        if (basePrice == null) {
            basePrice = product.getBasePrice();
        }
        if (basePrice == null) {
            return BigDecimal.ZERO;
        }
        return basePrice.add(priceAdjustment != null ? priceAdjustment : BigDecimal.ZERO);
    }

    public boolean isLowStock() {
        return stock <= product.getLowStockThreshold();
    }

    public boolean isOutOfStock() {
        return stock <= 0;
    }
}
