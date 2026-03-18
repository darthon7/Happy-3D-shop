package com.dazehaze.service;

import com.dazehaze.entity.CartItem;
import com.dazehaze.entity.Product;
import com.dazehaze.dto.shipping.PackageInfo;
import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
@Slf4j
public class PackageCalculator {

    private static final double PACKAGING_WEIGHT_KG = 0.200;
    private static final double PADDING_CM = 5.0;
    private static final double MAX_WEIGHT_KG = 20.0;
    private static final double MAX_DIMENSION_CM = 60.0;

    private static final double DEFAULT_WEIGHT_KG = 0.500;
    private static final double DEFAULT_LENGTH_CM = 30.0;
    private static final double DEFAULT_WIDTH_CM = 25.0;
    private static final double DEFAULT_HEIGHT_CM = 2.0;

    public PackageInfo calculatePackage(List<CartItem> cartItems) {
        log.info("=== CALCULATING PACKAGE ===");
        log.info("Cart items: {}", cartItems.size());

        if (cartItems == null || cartItems.isEmpty()) {
            log.warn("Empty cart, returning default package");
            return createDefaultPackage();
        }

        double totalWeight = calculateTotalWeight(cartItems);
        log.info("Products weight: {} kg", totalWeight);

        double finalWeight = totalWeight + PACKAGING_WEIGHT_KG;
        log.info("Final weight (with packaging): {} kg", finalWeight);

        PackageDimensions dims = calculateDimensions(cartItems);
        log.info("Base dimensions: {}x{}x{} cm", dims.getLength(), dims.getWidth(), dims.getHeight());

        double finalLength = dims.getLength() + PADDING_CM;
        double finalWidth = dims.getWidth() + PADDING_CM;
        double finalHeight = dims.getHeight() + PADDING_CM;
        log.info("Final dimensions: {}x{}x{} cm", finalLength, finalWidth, finalHeight);

        BigDecimal declaredValue = calculateDeclaredValue(cartItems);
        log.info("Declared value: ${}", declaredValue);

        String contentDescription = buildContentDescription(cartItems);
        log.info("Content: {}", contentDescription);

        int numberOfPackages = determineNumberOfPackages(finalWeight, finalLength, finalWidth, finalHeight);
        log.info("Number of packages: {}", numberOfPackages);

        log.info("=== PACKAGE CALCULATION COMPLETE ===");

        return PackageInfo.builder()
                .totalWeightKg(finalWeight)
                .lengthCm(finalLength)
                .widthCm(finalWidth)
                .heightCm(finalHeight)
                .declaredValue(declaredValue)
                .contentDescription(contentDescription)
                .numberOfPackages(numberOfPackages)
                .build();
    }

    private double calculateTotalWeight(List<CartItem> cartItems) {
        double total = 0.0;

        for (CartItem item : cartItems) {
            Product product = item.getProductVariant().getProduct();
            Integer weightGrams = item.getProductVariant().getWeightGrams();

            double weightKg;
            if (weightGrams != null && weightGrams > 0) {
                weightKg = weightGrams / 1000.0;
            } else if (product.getWeightKg() != null && product.getWeightKg() > 0) {
                weightKg = product.getWeightKg();
            } else {
                weightKg = DEFAULT_WEIGHT_KG;
                log.warn("Product '{}' has no weight, using default: {} kg",
                        product.getName(), DEFAULT_WEIGHT_KG);
            }

            double itemWeight = weightKg * item.getQuantity();
            total += itemWeight;

            log.debug("  - {} x{} = {} kg",
                    product.getName(),
                    item.getQuantity(),
                    itemWeight);
        }

        return Math.max(total, 0.1);
    }

    private PackageDimensions calculateDimensions(List<CartItem> cartItems) {
        double maxLength = 0;
        double maxWidth = 0;
        double totalHeight = 0;

        for (CartItem item : cartItems) {
            Product product = item.getProductVariant().getProduct();

            double length = (product.getLengthCm() != null && product.getLengthCm() > 0)
                    ? product.getLengthCm()
                    : DEFAULT_LENGTH_CM;
            double width = (product.getWidthCm() != null && product.getWidthCm() > 0)
                    ? product.getWidthCm()
                    : DEFAULT_WIDTH_CM;
            double height = (product.getHeightCm() != null && product.getHeightCm() > 0)
                    ? product.getHeightCm()
                    : DEFAULT_HEIGHT_CM;

            maxLength = Math.max(maxLength, length);
            maxWidth = Math.max(maxWidth, width);
            totalHeight += height * item.getQuantity();

            log.debug("  - {}: {}x{}x{} cm",
                    product.getName(), length, width, height);
        }

        maxLength = Math.max(maxLength, 20.0);
        maxWidth = Math.max(maxWidth, 15.0);
        totalHeight = Math.max(totalHeight, 5.0);

        return new PackageDimensions(maxLength, maxWidth, totalHeight);
    }

    private BigDecimal calculateDeclaredValue(List<CartItem> cartItems) {
        BigDecimal total = BigDecimal.ZERO;

        for (CartItem item : cartItems) {
            BigDecimal itemPrice = item.getProductVariant().getFinalPrice();
            BigDecimal itemTotal = itemPrice.multiply(BigDecimal.valueOf(item.getQuantity()));
            total = total.add(itemTotal);

            log.debug("  - {} x{} = ${}",
                    item.getProductVariant().getProduct().getName(),
                    item.getQuantity(),
                    itemTotal);
        }

        return total;
    }

    private String buildContentDescription(List<CartItem> cartItems) {
        StringBuilder desc = new StringBuilder("Impresiones 3D: ");

        int itemsProcessed = 0;
        for (CartItem item : cartItems) {
            Product product = item.getProductVariant().getProduct();

            if (itemsProcessed > 0) {
                desc.append(", ");
            }

            desc.append(item.getQuantity())
                    .append("x ")
                    .append(product.getName());

            itemsProcessed++;

            if (desc.length() > 80 && itemsProcessed < cartItems.size()) {
                desc.append("...");
                break;
            }
        }

        String result = desc.toString();
        return result.length() > 100 ? result.substring(0, 97) + "..." : result;
    }

    private int determineNumberOfPackages(double weight, double length, double width, double height) {
        boolean exceedsWeight = weight > MAX_WEIGHT_KG;
        boolean exceedsDimensions = length > MAX_DIMENSION_CM ||
                width > MAX_DIMENSION_CM ||
                height > MAX_DIMENSION_CM;

        if (exceedsWeight || exceedsDimensions) {
            int packagesNeeded = (int) Math.ceil(weight / MAX_WEIGHT_KG);
            log.warn("Package exceeds limits. Splitting into {} packages", packagesNeeded);
            return Math.max(packagesNeeded, 1);
        }

        return 1;
    }

    private PackageInfo createDefaultPackage() {
        return PackageInfo.builder()
                .totalWeightKg(1.0)
                .lengthCm(30.0)
                .widthCm(25.0)
                .heightCm(10.0)
                .declaredValue(BigDecimal.valueOf(100))
                .contentDescription("Impresiones 3D")
                .numberOfPackages(1)
                .build();
    }

    @Data
    @AllArgsConstructor
    private static class PackageDimensions {
        private double length;
        private double width;
        private double height;
    }
}
