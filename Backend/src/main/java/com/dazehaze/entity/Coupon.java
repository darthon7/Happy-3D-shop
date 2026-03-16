package com.dazehaze.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "coupons")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false)
    private DiscountType discountType;

    @Column(name = "discount_value", nullable = false, precision = 10, scale = 2)
    private BigDecimal discountValue;

    @Column(name = "min_purchase", precision = 10, scale = 2)
    private BigDecimal minPurchase = BigDecimal.ZERO;

    @Column(name = "max_discount", precision = 10, scale = 2)
    private BigDecimal maxDiscount; // For percentage discounts

    @Column(name = "max_uses")
    private Integer maxUses;

    @Column(name = "used_count")
    private Integer usedCount = 0;

    @Column(name = "valid_from")
    private LocalDateTime validFrom;

    @Column(name = "valid_until")
    private LocalDateTime validUntil;

    @Column(name = "is_active")
    private Boolean isActive = true;

    public enum DiscountType {
        PERCENTAGE, FIXED
    }

    // Helper methods
    public boolean isValid() {
        if (!isActive)
            return false;

        LocalDateTime now = LocalDateTime.now();
        if (validFrom != null && now.isBefore(validFrom))
            return false;
        if (validUntil != null && now.isAfter(validUntil))
            return false;
        if (maxUses != null && (usedCount != null ? usedCount : 0) >= maxUses)
            return false;

        return true;
    }

    public boolean isApplicable(BigDecimal subtotal) {
        if (!isValid())
            return false;
        if (minPurchase != null && subtotal.compareTo(minPurchase) < 0)
            return false;
        return true;
    }

    public BigDecimal calculateDiscount(BigDecimal subtotal) {
        if (!isApplicable(subtotal))
            return BigDecimal.ZERO;

        BigDecimal discount;
        if (discountType == DiscountType.PERCENTAGE) {
            discount = subtotal.multiply(discountValue).divide(BigDecimal.valueOf(100), 2,
                    java.math.RoundingMode.HALF_UP);
            if (maxDiscount != null && discount.compareTo(maxDiscount) > 0) {
                discount = maxDiscount;
            }
        } else {
            discount = discountValue;
        }

        // Discount cannot exceed subtotal
        return discount.compareTo(subtotal) > 0 ? subtotal : discount;
    }
}
