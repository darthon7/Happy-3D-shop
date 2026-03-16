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

    private String size;

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

    // Relationships
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    // Helper method to get final price
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

    // Helper method to check if low stock
    public boolean isLowStock() {
        return stock <= product.getLowStockThreshold();
    }

    // Helper method to check if out of stock
    public boolean isOutOfStock() {
        return stock <= 0;
    }
}
