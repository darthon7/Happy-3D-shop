package com.dazehaze.service;

import com.dazehaze.dto.admin.CreateProductRequest;
import com.dazehaze.dto.product.ProductResponse;
import com.dazehaze.entity.*;
import com.dazehaze.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminProductServiceTest {

    @Mock
    private ProductRepository productRepository;
    @Mock
    private ProductVariantRepository productVariantRepository;
    @Mock
    private ProductImageRepository productImageRepository;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private ReviewRepository reviewRepository;
    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private AdminProductService adminProductService;

    private CreateProductRequest testRequest;
    private Product testProduct;

    @BeforeEach
    void setUp() {
        testRequest = CreateProductRequest.builder()
                .name("Test Product")
                .slug("test-product")
                .basePrice(new BigDecimal("99.99"))
                .isFeatured(false)
                .isNew(true)
                .isActive(true)
                .variants(new ArrayList<>())
                .images(new ArrayList<>())
                .build();

        testProduct = Product.builder()
                .id(1L)
                .name("Test Product")
                .slug("test-product")
                .basePrice(new BigDecimal("99.99"))
                .isFeatured(false)
                .isNew(true)
                .isActive(true)
                .variants(new ArrayList<>())
                .images(new ArrayList<>())
                .build();
    }

    @Test
    void createProduct_ValidRequest_Success() {
        // Arrange
        when(productRepository.existsBySlug(anyString())).thenReturn(false);
        when(productRepository.save(any(Product.class))).thenReturn(testProduct);

        CreateProductRequest.VariantRequest variantReq = CreateProductRequest.VariantRequest.builder()
                .sku("SKU-1")
                .stock(10)
                .build();
        testRequest.getVariants().add(variantReq);

        // Act
        ProductResponse response = adminProductService.createProduct(testRequest);

        // Assert
        assertNotNull(response);
        assertEquals("Test Product", response.getName());
        assertTrue(response.getIsActive());

        verify(productRepository, times(2)).save(any(Product.class)); // 1 inicial, 1 con variantes
        verify(notificationService).notifyAllUsers(
                any(NotificationType.class), anyString(), anyString(), anyString(), eq(1L), anyString(), any());
    }

    @Test
    void createProduct_DuplicateSlug_ThrowsException() {
        // Arrange
        when(productRepository.existsBySlug("test-product")).thenReturn(true);

        // Act & Assert
        Exception e = assertThrows(RuntimeException.class, () -> adminProductService.createProduct(testRequest));
        assertEquals("Product slug already exists: test-product", e.getMessage());
        verify(productRepository, never()).save(any());
    }

    @Test
    void toggleProductStatus_ValidId_TogglesAndSaves() {
        // Arrange
        assertTrue(testProduct.getIsActive());
        when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));

        // Act
        ProductResponse response = adminProductService.toggleProductStatus(1L);

        // Assert
        assertFalse(response.getIsActive()); // Cambió de true a false
        verify(productRepository).save(testProduct);
    }

    @Test
    void toggleProductStatus_InvalidId_ThrowsException() {
        // Arrange
        when(productRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class, () -> adminProductService.toggleProductStatus(99L));
    }

    @Test
    void updateStock_ValidVariant_SavesNewStock() {
        // Arrange
        ProductVariant variant = ProductVariant.builder().id(1L).stock(5).build();
        when(productVariantRepository.findById(1L)).thenReturn(Optional.of(variant));

        // Act
        adminProductService.updateStock(1L, 20);

        // Assert
        assertEquals(20, variant.getStock());
        verify(productVariantRepository).save(variant);
    }
}
