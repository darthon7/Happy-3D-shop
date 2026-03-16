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

/**
 * Calculates dynamic package dimensions and weight based on actual cart items
 * This replaces hardcoded values to provide accurate shipping quotes
 */
@Component
@Slf4j
public class PackageCalculator {

    // Packaging constants
    private static final double PACKAGING_WEIGHT_KG = 0.200; // Box + padding weight
    private static final double PADDING_CM = 5.0; // Extra space for safety
    private static final double MAX_WEIGHT_KG = 20.0; // Max weight per package
    private static final double MAX_DIMENSION_CM = 60.0; // Max dimension per side

    // Default values if product has no dimensions
    private static final double DEFAULT_WEIGHT_KG = 0.500;
    private static final double DEFAULT_LENGTH_CM = 30.0;
    private static final double DEFAULT_WIDTH_CM = 25.0;
    private static final double DEFAULT_HEIGHT_CM = 2.0;

    /**
     * Calculate package info dynamically from cart items
     * 
     * @param cartItems List of items in the cart
     * @return PackageInfo with calculated dimensions, weight, and value
     */
    public PackageInfo calculatePackage(List<CartItem> cartItems) {

        log.info("=== CALCULATING PACKAGE ===");
        log.info("Cart items: {}", cartItems.size());

        if (cartItems == null || cartItems.isEmpty()) {
            log.warn("Empty cart, returning default package");
            return createDefaultPackage();
        }

        // 1. CALCULATE TOTAL WEIGHT
        double totalWeight = calculateTotalWeight(cartItems);
        log.info("Products weight: {} kg", totalWeight);

        double finalWeight = totalWeight + PACKAGING_WEIGHT_KG;
        log.info("Final weight (with packaging): {} kg", finalWeight);

        // 2. CALCULATE DIMENSIONS
        PackageDimensions dims = calculateDimensions(cartItems);
        log.info("Base dimensions: {}x{}x{} cm", dims.getLength(), dims.getWidth(), dims.getHeight());

        double finalLength = dims.getLength() + PADDING_CM;
        double finalWidth = dims.getWidth() + PADDING_CM;
        double finalHeight = dims.getHeight() + PADDING_CM;
        log.info("Final dimensions: {}x{}x{} cm", finalLength, finalWidth, finalHeight);

        // 3. CALCULATE DECLARED VALUE
        BigDecimal declaredValue = calculateDeclaredValue(cartItems);
        log.info("Declared value: ${}", declaredValue);

        // 4. BUILD CONTENT DESCRIPTION
        String contentDescription = buildContentDescription(cartItems);
        log.info("Content: {}", contentDescription);

        // 5. DETERMINE NUMBER OF PACKAGES
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

    /**
     * Calculate total weight by summing all product weights
     */
    private double calculateTotalWeight(List<CartItem> cartItems) {
        double total = 0.0;

        for (CartItem item : cartItems) {
            Product product = item.getProductVariant().getProduct();

            // Get weight or use default
            double weight = (product.getWeightKg() != null && product.getWeightKg() > 0)
                    ? product.getWeightKg()
                    : DEFAULT_WEIGHT_KG;

            if (product.getWeightKg() == null || product.getWeightKg() <= 0) {
                log.warn("Product '{}' has no weight, using default: {} kg",
                        product.getName(), DEFAULT_WEIGHT_KG);
            }

            double itemWeight = weight * item.getQuantity();
            total += itemWeight;

            log.debug("  - {} x{} = {} kg",
                    product.getName(),
                    item.getQuantity(),
                    itemWeight);
        }

        return Math.max(total, 0.1); // Minimum 100g
    }

    /**
     * Calculate package dimensions
     * Strategy for clothing: use max length/width, sum heights (items stack)
     */
    private PackageDimensions calculateDimensions(List<CartItem> cartItems) {
        double maxLength = 0;
        double maxWidth = 0;
        double totalHeight = 0;

        for (CartItem item : cartItems) {
            Product product = item.getProductVariant().getProduct();

            // Get dimensions or use defaults
            double length = (product.getLengthCm() != null && product.getLengthCm() > 0)
                    ? product.getLengthCm()
                    : DEFAULT_LENGTH_CM;
            double width = (product.getWidthCm() != null && product.getWidthCm() > 0)
                    ? product.getWidthCm()
                    : DEFAULT_WIDTH_CM;
            double height = (product.getHeightCm() != null && product.getHeightCm() > 0)
                    ? product.getHeightCm()
                    : DEFAULT_HEIGHT_CM;

            // Take maximum length and width
            maxLength = Math.max(maxLength, length);
            maxWidth = Math.max(maxWidth, width);

            // Stack items (multiply height by quantity)
            totalHeight += height * item.getQuantity();

            log.debug("  - {}: {}x{}x{} cm",
                    product.getName(), length, width, height);
        }

        // Ensure minimum dimensions
        maxLength = Math.max(maxLength, 20.0);
        maxWidth = Math.max(maxWidth, 15.0);
        totalHeight = Math.max(totalHeight, 5.0);

        return new PackageDimensions(maxLength, maxWidth, totalHeight);
    }

    /**
     * Calculate total declared value (sum of product prices)
     */
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

    /**
     * Build human-readable content description
     */
    private String buildContentDescription(List<CartItem> cartItems) {
        StringBuilder desc = new StringBuilder("Ropa: ");

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

            // Limit to avoid too long descriptions
            if (desc.length() > 80 && itemsProcessed < cartItems.size()) {
                desc.append("...");
                break;
            }
        }

        String result = desc.toString();
        // Envia.com content field max length is typically 100-150 chars
        return result.length() > 100 ? result.substring(0, 97) + "..." : result;
    }

    /**
     * Determine if multiple packages are needed based on size/weight limits
     */
    private int determineNumberOfPackages(double weight, double length, double width, double height) {
        // Check if exceeds carrier limits
        boolean exceedsWeight = weight > MAX_WEIGHT_KG;
        boolean exceedsDimensions = length > MAX_DIMENSION_CM ||
                width > MAX_DIMENSION_CM ||
                height > MAX_DIMENSION_CM;

        if (exceedsWeight || exceedsDimensions) {
            // Calculate packages needed based on weight (simplest approach)
            int packagesNeeded = (int) Math.ceil(weight / MAX_WEIGHT_KG);
            log.warn("Package exceeds limits. Splitting into {} packages", packagesNeeded);
            return Math.max(packagesNeeded, 1);
        }

        return 1;
    }

    /**
     * Create default package for empty cart or errors
     */
    private PackageInfo createDefaultPackage() {
        return PackageInfo.builder()
                .totalWeightKg(1.0)
                .lengthCm(30.0)
                .widthCm(25.0)
                .heightCm(10.0)
                .declaredValue(BigDecimal.valueOf(100))
                .contentDescription("Producto")
                .numberOfPackages(1)
                .build();
    }

    /**
     * Inner class to hold dimension data
     */
    @Data
    @AllArgsConstructor
    private static class PackageDimensions {
        private double length;
        private double width;
        private double height;
    }
}
