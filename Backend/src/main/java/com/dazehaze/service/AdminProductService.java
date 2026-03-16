package com.dazehaze.service;

import com.dazehaze.dto.admin.CreateProductRequest;
import com.dazehaze.dto.common.PageResponse;
import com.dazehaze.dto.product.ProductResponse;
import com.dazehaze.entity.*;
import com.dazehaze.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminProductService {

    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final ProductImageRepository productImageRepository;
    private final CategoryRepository categoryRepository;
    private final ReviewRepository reviewRepository;
    private final CartItemRepository cartItemRepository;
    private final NotificationService notificationService;

    @Transactional
    public ProductResponse createProduct(CreateProductRequest request) {
        // Validate slug uniqueness
        if (productRepository.existsBySlug(request.getSlug())) {
            throw new RuntimeException("Product slug already exists: " + request.getSlug());
        }

        // Get category if provided
        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
        }

        // Create product
        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .shortDescription(request.getShortDescription())
                .basePrice(request.getBasePrice())
                .salePrice(request.getSalePrice())
                .slug(request.getSlug())
                .category(category)
                .isFeatured(request.getIsFeatured())
                .isNew(request.getIsNew())
                .isActive(request.getIsActive())
                .lowStockThreshold(request.getLowStockThreshold())
                .metaTitle(request.getMetaTitle())
                .metaDescription(request.getMetaDescription())
                // Shipping dimensions
                .weightKg(request.getWeightKg())
                .lengthCm(request.getLengthCm())
                .widthCm(request.getWidthCm())
                .heightCm(request.getHeightCm())
                .build();

        Product savedProduct = productRepository.save(product);

        // Create variants
        if (request.getVariants() != null) {
            for (CreateProductRequest.VariantRequest variantReq : request.getVariants()) {
                if (productVariantRepository.existsBySku(variantReq.getSku())) {
                    throw new RuntimeException("SKU already exists: " + variantReq.getSku());
                }
                ProductVariant variant = ProductVariant.builder()
                        .product(savedProduct)
                        .sku(variantReq.getSku())
                        .size(variantReq.getSize())
                        .color(variantReq.getColor())
                        .colorHex(variantReq.getColorHex())
                        .material(variantReq.getMaterial())
                        .stock(variantReq.getStock())
                        .priceAdjustment(variantReq.getPriceAdjustment())
                        .build();
                savedProduct.getVariants().add(variant);
            }
        }

        // Create images
        if (request.getImages() != null) {
            for (CreateProductRequest.ImageRequest imageReq : request.getImages()) {
                ProductImage image = ProductImage.builder()
                        .product(savedProduct)
                        .url(imageReq.getUrl())
                        .altText(imageReq.getAltText())
                        .sortOrder(imageReq.getSortOrder())
                        .isMain(imageReq.getIsMain())
                        .mediaType(ProductImage.MediaType.valueOf(imageReq.getMediaType()))
                        .build();
                savedProduct.getImages().add(image);
            }
        }

        productRepository.save(savedProduct);

        // Send notification about new product (wrapped in try-catch to prevent crashes)
        try {
            String imageUrl = null;
            if (savedProduct.getImages() != null && !savedProduct.getImages().isEmpty()) {
                imageUrl = savedProduct.getImages().stream()
                        .filter(img -> img.getIsMain() != null && img.getIsMain())
                        .findFirst()
                        .map(ProductImage::getUrl)
                        .orElse(savedProduct.getImages().get(0).getUrl());
            }

            notificationService.notifyAllUsers(
                    com.dazehaze.entity.NotificationType.NEW_PRODUCT,
                    "Nuevo producto disponible",
                    "¡Mira nuestro nuevo producto: " + savedProduct.getName() + "!",
                    "/producto/" + savedProduct.getSlug(),
                    savedProduct.getId(),
                    savedProduct.getName(),
                    imageUrl);
        } catch (Exception e) {
            // Log but don't crash the product creation
            org.slf4j.LoggerFactory.getLogger(AdminProductService.class)
                    .error("Failed to send notification for new product: {}", e.getMessage());
        }

        return mapToProductResponse(savedProduct);
    }

    @Transactional
    public ProductResponse updateProduct(Long id, CreateProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        // Check slug if changed
        if (!product.getSlug().equals(request.getSlug()) && productRepository.existsBySlug(request.getSlug())) {
            throw new RuntimeException("Product slug already exists: " + request.getSlug());
        }

        // Update category
        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
        }

        // Update basic fields
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setShortDescription(request.getShortDescription());
        product.setBasePrice(request.getBasePrice());
        product.setSalePrice(request.getSalePrice());
        product.setSlug(request.getSlug());
        product.setCategory(category);
        product.setIsFeatured(request.getIsFeatured());
        product.setIsNew(request.getIsNew());
        product.setIsActive(request.getIsActive());
        product.setLowStockThreshold(request.getLowStockThreshold());
        product.setMetaTitle(request.getMetaTitle());
        product.setMetaDescription(request.getMetaDescription());
        // Shipping dimensions
        product.setWeightKg(request.getWeightKg());
        product.setLengthCm(request.getLengthCm());
        product.setWidthCm(request.getWidthCm());
        product.setHeightCm(request.getHeightCm());

        // Update variants - update existing, add new, deactivate removed
        if (request.getVariants() != null && !request.getVariants().isEmpty()) {
            // Get existing variant SKUs
            List<String> existingSkus = product.getVariants().stream()
                    .map(ProductVariant::getSku)
                    .collect(Collectors.toList());

            List<String> newSkus = request.getVariants().stream()
                    .map(CreateProductRequest.VariantRequest::getSku)
                    .collect(Collectors.toList());

            // Deactivate variants that are no longer in the request (instead of deleting)
            // Also remove these items from all carts
            for (ProductVariant existingVariant : product.getVariants()) {
                if (!newSkus.contains(existingVariant.getSku())) {
                    // Remove items from carts before deactivating
                    cartItemRepository.deleteByProductVariantId(existingVariant.getId());
                    existingVariant.setIsActive(false);
                }
            }

            // Update or create variants
            for (CreateProductRequest.VariantRequest variantReq : request.getVariants()) {
                // Check if variant with this SKU already exists for this product
                ProductVariant existingVariant = product.getVariants().stream()
                        .filter(v -> v.getSku().equals(variantReq.getSku()))
                        .findFirst()
                        .orElse(null);

                if (existingVariant != null) {
                    // Update existing variant
                    existingVariant.setSize(variantReq.getSize());
                    existingVariant.setColor(variantReq.getColor());
                    existingVariant.setColorHex(variantReq.getColorHex());
                    existingVariant.setMaterial(variantReq.getMaterial());
                    existingVariant.setStock(variantReq.getStock());
                    existingVariant.setPriceAdjustment(variantReq.getPriceAdjustment());
                    // Preserve or update isActive based on request
                    if (variantReq.getIsActive() != null) {
                        existingVariant.setIsActive(variantReq.getIsActive());
                    }
                } else {
                    // Check SKU uniqueness for new variant
                    if (productVariantRepository.existsBySkuAndProductIdNot(variantReq.getSku(), id)) {
                        throw new RuntimeException("SKU already exists: " + variantReq.getSku());
                    }
                    // Create new variant
                    ProductVariant variant = ProductVariant.builder()
                            .product(product)
                            .sku(variantReq.getSku())
                            .size(variantReq.getSize())
                            .color(variantReq.getColor())
                            .colorHex(variantReq.getColorHex())
                            .material(variantReq.getMaterial())
                            .stock(variantReq.getStock())
                            .priceAdjustment(variantReq.getPriceAdjustment())
                            .isActive(variantReq.getIsActive() != null ? variantReq.getIsActive() : true)
                            .build();
                    product.getVariants().add(variant);
                }
            }
        }

        // Update images - clear and recreate
        if (request.getImages() != null && !request.getImages().isEmpty()) {
            // Delete existing images
            productImageRepository.deleteAll(product.getImages());
            product.getImages().clear();

            // Create new images
            for (CreateProductRequest.ImageRequest imageReq : request.getImages()) {
                ProductImage image = ProductImage.builder()
                        .product(product)
                        .url(imageReq.getUrl())
                        .altText(imageReq.getAltText())
                        .sortOrder(imageReq.getSortOrder())
                        .isMain(imageReq.getIsMain())
                        .mediaType(ProductImage.MediaType.valueOf(imageReq.getMediaType()))
                        .build();
                product.getImages().add(image);
            }
        }

        productRepository.save(product);
        return mapToProductResponse(product);
    }

    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        productRepository.delete(product);
    }

    @Transactional
    public ProductResponse toggleProductStatus(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        product.setIsActive(!product.getIsActive());
        productRepository.save(product);
        return mapToProductResponse(product);
    }

    @Transactional
    public void updateStock(Long variantId, Integer quantity) {
        ProductVariant variant = productVariantRepository.findById(variantId)
                .orElseThrow(() -> new RuntimeException("Variant not found"));
        variant.setStock(quantity);
        productVariantRepository.save(variant);
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> getAllProducts(int page, int size, String sortBy, String sortDir) {
        Sort sort = "desc".equalsIgnoreCase(sortDir) ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Product> productPage = productRepository.findAll(pageable);

        List<ProductResponse> content = productPage.getContent().stream()
                .map(this::mapToProductResponse)
                .collect(Collectors.toList());

        return PageResponse.<ProductResponse>builder()
                .content(content)
                .page(productPage.getNumber())
                .size(productPage.getSize())
                .totalElements(productPage.getTotalElements())
                .totalPages(productPage.getTotalPages())
                .isFirst(productPage.isFirst())
                .isLast(productPage.isLast())
                .hasNext(productPage.hasNext())
                .hasPrevious(productPage.hasPrevious())
                .build();
    }

    private ProductResponse mapToProductResponse(Product product) {
        String mainImageUrl = product.getImages().stream()
                .filter(ProductImage::getIsMain)
                .findFirst()
                .map(ProductImage::getUrl)
                .orElse(product.getImages().isEmpty() ? null : product.getImages().get(0).getUrl());

        Double avgRating = reviewRepository.getAverageRating(product.getId());
        long reviewCount = reviewRepository.countApprovedByProductId(product.getId());

        List<ProductResponse.VariantInfo> variants = product.getVariants().stream()
                .map(v -> ProductResponse.VariantInfo.builder()
                        .id(v.getId())
                        .sku(v.getSku())
                        .size(v.getSize())
                        .color(v.getColor())
                        .colorHex(v.getColorHex())
                        .stock(v.getStock())
                        .finalPrice(v.getFinalPrice())
                        .isLowStock(v.isLowStock())
                        .isOutOfStock(v.isOutOfStock())
                        .isActive(v.getIsActive())
                        .build())
                .collect(Collectors.toList());

        List<ProductResponse.ImageInfo> images = product.getImages().stream()
                .map(i -> ProductResponse.ImageInfo.builder()
                        .id(i.getId())
                        .url(i.getUrl())
                        .altText(i.getAltText())
                        .isMain(i.getIsMain())
                        .mediaType(i.getMediaType().name())
                        .build())
                .collect(Collectors.toList());

        ProductResponse.CategoryInfo categoryInfo = null;
        if (product.getCategory() != null) {
            categoryInfo = ProductResponse.CategoryInfo.builder()
                    .id(product.getCategory().getId())
                    .name(product.getCategory().getName())
                    .slug(product.getCategory().getSlug())
                    .build();
        }

        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .shortDescription(product.getShortDescription())
                .basePrice(product.getBasePrice())
                .salePrice(product.getSalePrice())
                .currentPrice(product.getCurrentPrice())
                .slug(product.getSlug())
                .isFeatured(product.getIsFeatured())
                .isNew(product.getIsNew())
                .isActive(product.getIsActive())
                .isOnSale(product.isOnSale())
                .discountPercentage(product.getDiscountPercentage())
                .mainImageUrl(mainImageUrl)
                .category(categoryInfo)
                .variants(variants)
                .images(images)
                .averageRating(avgRating)
                .reviewCount(reviewCount)
                .build();
    }
}
