package com.dazehaze.controller.admin;

import com.dazehaze.dto.admin.CreateCouponRequest;
import com.dazehaze.entity.Coupon;
import com.dazehaze.repository.CouponRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/coupons")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
public class AdminCouponController {

    private final CouponRepository couponRepository;

    @GetMapping
    public ResponseEntity<List<Coupon>> getAllCoupons() {
        return ResponseEntity.ok(couponRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<Coupon> createCoupon(@Valid @RequestBody CreateCouponRequest request) {
        if (couponRepository.existsByCode(request.getCode())) {
            throw new RuntimeException("Coupon code already exists: " + request.getCode());
        }

        Coupon coupon = Coupon.builder()
                .code(request.getCode().toUpperCase())
                .description(request.getDescription())
                .discountType(Coupon.DiscountType.valueOf(request.getDiscountType().name()))
                .discountValue(request.getDiscountValue())
                .minPurchase(request.getMinPurchase())
                .maxDiscount(request.getMaxDiscount())
                .maxUses(request.getMaxUses())
                .validFrom(request.getValidFrom())
                .validUntil(request.getValidUntil())
                .isActive(request.getIsActive())
                .build();

        Coupon saved = couponRepository.save(coupon);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Coupon> updateCoupon(@PathVariable Long id, @Valid @RequestBody CreateCouponRequest request) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Coupon not found"));

        if (!coupon.getCode().equals(request.getCode().toUpperCase()) &&
                couponRepository.existsByCode(request.getCode())) {
            throw new RuntimeException("Coupon code already exists: " + request.getCode());
        }

        coupon.setCode(request.getCode().toUpperCase());
        coupon.setDescription(request.getDescription());
        coupon.setDiscountType(Coupon.DiscountType.valueOf(request.getDiscountType().name()));
        coupon.setDiscountValue(request.getDiscountValue());
        coupon.setMinPurchase(request.getMinPurchase());
        coupon.setMaxDiscount(request.getMaxDiscount());
        coupon.setMaxUses(request.getMaxUses());
        coupon.setValidFrom(request.getValidFrom());
        coupon.setValidUntil(request.getValidUntil());
        coupon.setIsActive(request.getIsActive());

        return ResponseEntity.ok(couponRepository.save(coupon));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCoupon(@PathVariable Long id) {
        couponRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<Coupon> toggleCoupon(@PathVariable Long id) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Coupon not found"));
        coupon.setIsActive(!coupon.getIsActive());
        return ResponseEntity.ok(couponRepository.save(coupon));
    }
}
