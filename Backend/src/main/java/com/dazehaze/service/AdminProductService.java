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
        if (productRepository.existsBySlug(request.getSlug())) {
            throw new RuntimeException("Product slug already exists: " + request.getSlug());
        }

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
        }

        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
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
                .weightKg(request.getWeightKg())
                .lengthCm(request.getLengthCm())
                .widthCm(request.getWidthCm())
                .heightCm(request.getHeightCm())
                .build();

        Product savedProduct = productRepository.save(product);

        if (request.getMaterials() != null) {
            for (CreateProductRequest.MaterialRequest matReq : request.getMaterials()) {
                if (productVariantRepository.existsBySku(matReq.getSku())) {
                    throw new RuntimeException("SKU already exists: " + matReq.getSku());
                }
                ProductVariant variant = ProductVariant.builder()
                        .product(savedProduct)
                        .sku(matReq.getSku())
                        .material(matReq.getMaterial())
                        .color(matReq.getColor())
                        .colorHex(matReq.getColorHex())
                        .stock(matReq.getStock())
                        .priceAdjustment(matReq.getPriceAdjustment())
                        .estimatedPrintMinutes(matReq.getEstimatedPrintMinutes())
                        .weightGrams(matReq.getWeightGrams())
                        .infillOptions(matReq.getInfillOptions())
                        .layerHeightOptions(matReq.getLayerHeightOptions())
                        .requiresSupport(matReq.getRequiresSupport())
                        .postProcessing(matReq.getPostProcessing())
                        .dimensionalAccuracy(matReq.getDimensionalAccuracy())
                        .printTechnology(matReq.getPrintTechnology())
                        .stlSpecs(matReq.getStlSpecs())
                        .build();
                savedProduct.getVariants().add(variant);
            }
        }

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
            org.slf4j.LoggerFactory.getLogger(AdminProductService.class)
                    .error("Failed to send notification for new product: {}", e.getMessage());
        }

        return mapToProductResponse(savedProduct);
    }

    @Transactional
    public ProductResponse updateProduct(Long id, CreateProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if (!product.getSlug().equals(request.getSlug()) && productRepository.existsBySlug(request.getSlug())) {
            throw new RuntimeException("Product slug already exists: " + request.getSlug());
        }

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
        }

        product.setName(request.getName());
        product.setDescription(request.getDescription());
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
        product.setWeightKg(request.getWeightKg());
        product.setLengthCm(request.getLengthCm());
        product.setWidthCm(request.getWidthCm());
        product.setHeightCm(request.getHeightCm());

        if (request.getMaterials() != null && !request.getMaterials().isEmpty()) {
            List<String> newSkus = request.getMaterials().stream()
                    .map(CreateProductRequest.MaterialRequest::getSku)
                    .collect(Collectors.toList());

            for (ProductVariant existingVariant : product.getVariants()) {
                if (!newSkus.contains(existingVariant.getSku())) {
                    cartItemRepository.deleteByProductVariantId(existingVariant.getId());
                    existingVariant.setIsActive(false);
                }
            }

            for (CreateProductRequest.MaterialRequest matReq : request.getMaterials()) {
                ProductVariant existingVariant = product.getVariants().stream()
                        .filter(v -> v.getSku().equals(matReq.getSku()))
                        .findFirst()
                        .orElse(null);

                if (existingVariant != null) {
                    existingVariant.setMaterial(matReq.getMaterial());
                    existingVariant.setColor(matReq.getColor());
                    existingVariant.setColorHex(matReq.getColorHex());
                    existingVariant.setStock(matReq.getStock());
                    existingVariant.setPriceAdjustment(matReq.getPriceAdjustment());
                    existingVariant.setEstimatedPrintMinutes(matReq.getEstimatedPrintMinutes());
                    existingVariant.setWeightGrams(matReq.getWeightGrams());
                    existingVariant.setInfillOptions(matReq.getInfillOptions());
                    existingVariant.setLayerHeightOptions(matReq.getLayerHeightOptions());
                    existingVariant.setRequiresSupport(matReq.getRequiresSupport());
                    existingVariant.setPostProcessing(matReq.getPostProcessing());
                    existingVariant.setDimensionalAccuracy(matReq.getDimensionalAccuracy());
                    existingVariant.setPrintTechnology(matReq.getPrintTechnology());
                    existingVariant.setStlSpecs(matReq.getStlSpecs());
                    if (matReq.getIsActive() != null) {
                        existingVariant.setIsActive(matReq.getIsActive());
                    }
                } else {
                    if (productVariantRepository.existsBySkuAndProductIdNot(matReq.getSku(), id)) {
                        throw new RuntimeException("SKU already exists: " + matReq.getSku());
                    }
                    ProductVariant variant = ProductVariant.builder()
                            .product(product)
                            .sku(matReq.getSku())
                            .material(matReq.getMaterial())
                            .color(matReq.getColor())
                            .colorHex(matReq.getColorHex())
                            .stock(matReq.getStock())
                            .priceAdjustment(matReq.getPriceAdjustment())
                            .estimatedPrintMinutes(matReq.getEstimatedPrintMinutes())
                            .weightGrams(matReq.getWeightGrams())
                            .infillOptions(matReq.getInfillOptions())
                            .layerHeightOptions(matReq.getLayerHeightOptions())
                            .requiresSupport(matReq.getRequiresSupport())
                            .postProcessing(matReq.getPostProcessing())
                            .dimensionalAccuracy(matReq.getDimensionalAccuracy())
                            .printTechnology(matReq.getPrintTechnology())
                            .stlSpecs(matReq.getStlSpecs())
                            .isActive(matReq.getIsActive() != null ? matReq.getIsActive() : true)
                            .build();
                    product.getVariants().add(variant);
                }
            }
        }

        if (request.getImages() != null && !request.getImages().isEmpty()) {
            productImageRepository.deleteAll(product.getImages());
            product.getImages().clear();

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

        List<ProductResponse.MaterialInfo> materials = product.getVariants().stream()
                .map(v -> ProductResponse.MaterialInfo.builder()
                        .id(v.getId())
                        .sku(v.getSku())
                        .material(v.getMaterial())
                        .color(v.getColor())
                        .colorHex(v.getColorHex())
                        .stock(v.getStock())
                        .priceAdjustment(v.getPriceAdjustment())
                        .finalPrice(v.getFinalPrice())
                        .isLowStock(v.isLowStock())
                        .isOutOfStock(v.isOutOfStock())
                        .isActive(v.getIsActive())
                        .estimatedPrintMinutes(v.getEstimatedPrintMinutes())
                        .weightGrams(v.getWeightGrams())
                        .infillOptions(v.getInfillOptions())
                        .layerHeightOptions(v.getLayerHeightOptions())
                        .requiresSupport(v.getRequiresSupport())
                        .postProcessing(v.getPostProcessing())
                        .dimensionalAccuracy(v.getDimensionalAccuracy())
                        .printTechnology(v.getPrintTechnology())
                        .stlSpecs(v.getStlSpecs())
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
                .materials(materials)
                .images(images)
                .averageRating(avgRating)
                .reviewCount(reviewCount)
                .build();
    }
}
