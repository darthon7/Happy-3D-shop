package com.dazehaze.entity;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class ProductVariantTest {

    private Product testProduct;
    private ProductVariant testVariant;

    @BeforeEach
    void setUp() {
        testProduct = Product.builder()
                .id(1L)
                .name("Test Product")
                .basePrice(new BigDecimal("100.00"))
                .build();

        testVariant = ProductVariant.builder()
                .id(1L)
                .product(testProduct)
                .sku("TEST-SKU")
                .stock(10)
                .build();
    }

    @Test
    void getFinalPrice_WithFormulaPrice_ReturnsFormulaPrice() {
        // Arrange
        // Simulate Hibernate populating the @Formula field
        testProduct.setCurrentPrice(new BigDecimal("80.00"));

        // Act
        BigDecimal finalPrice = testVariant.getFinalPrice();

        // Assert
        assertEquals(new BigDecimal("80.00"), finalPrice);
    }

    @Test
    void getFinalPrice_WithNullFormulaPrice_FallsBackToBasePrice() {
        // Arrange
        // currentPrice is null (typical before DB flush)
        testProduct.setCurrentPrice(null);

        // Act
        BigDecimal finalPrice = testVariant.getFinalPrice();

        // Assert
        assertEquals(new BigDecimal("100.00"), finalPrice);
    }

    @Test
    void getFinalPrice_WithPriceAdjustment_AppliesAdjustment() {
        // Arrange
        testProduct.setCurrentPrice(new BigDecimal("80.00"));
        testVariant.setPriceAdjustment(new BigDecimal("15.00")); // XL size surcharge

        // Act
        BigDecimal finalPrice = testVariant.getFinalPrice();

        // Assert
        assertEquals(new BigDecimal("95.00"), finalPrice); // 80 + 15
    }

    @Test
    void isOutOfStock_WhenStockIsZero_ReturnsTrue() {
        testVariant.setStock(0);
        assertTrue(testVariant.isOutOfStock());
    }

    @Test
    void isOutOfStock_WhenStockIsPositive_ReturnsFalse() {
        testVariant.setStock(5);
        assertFalse(testVariant.isOutOfStock());
    }

    @Test
    void isLowStock_WhenStockIsBelowThreshold_ReturnsTrue() {
        testProduct.setLowStockThreshold(10);
        testVariant.setStock(5);
        assertTrue(testVariant.isLowStock());
    }

    @Test
    void isLowStock_WhenStockIsAboveThreshold_ReturnsFalse() {
        testProduct.setLowStockThreshold(10);
        testVariant.setStock(15);
        assertFalse(testVariant.isLowStock());
    }
}
