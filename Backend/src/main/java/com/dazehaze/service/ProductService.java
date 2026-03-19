package com.dazehaze.service;

import com.dazehaze.dto.common.PageResponse;
import com.dazehaze.dto.product.ProductListResponse;
import com.dazehaze.dto.product.ProductResponse;
import com.dazehaze.entity.Product;
import com.dazehaze.entity.ProductImage;
import com.dazehaze.entity.ProductVariant;
import com.dazehaze.repository.ProductImageRepository;
import com.dazehaze.repository.ProductRepository;
import com.dazehaze.repository.ProductVariantRepository;
import com.dazehaze.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {

        private final ProductRepository productRepository;
        private final ProductVariantRepository productVariantRepository;
        private final ProductImageRepository productImageRepository;
        private final ReviewRepository reviewRepository;

        public PageResponse<ProductListResponse> getAllProducts(int page, int size, String sortBy, String sortDir) {
                Pageable pageable = createPageable(page, size, sortBy, sortDir);
                Page<Product> productPage = productRepository.findByIsActiveTrue(pageable);
                return mapToPageResponse(productPage);
        }

        public PageResponse<ProductListResponse> getProductsByCategory(Long categoryId, int page, int size,
                        String sortBy, String sortDir) {
                Pageable pageable = createPageable(page, size, sortBy, sortDir);
                Page<Product> productPage = productRepository.findByCategoryIdAndIsActiveTrue(categoryId, pageable);
                return mapToPageResponse(productPage);
        }

        public PageResponse<ProductListResponse> getProductsWithFilters(
                        String q, Long categoryId, BigDecimal minPrice, BigDecimal maxPrice,
                        int page, int size, String sortBy, String sortDir) {
                Pageable pageable = createPageable(page, size, sortBy, sortDir);
                Page<Product> productPage = productRepository.findWithFilters(q, categoryId, minPrice, maxPrice, pageable);
                return mapToPageResponse(productPage);
        }

        public PageResponse<ProductListResponse> searchProducts(String query, BigDecimal minPrice, BigDecimal maxPrice, int page, int size, String sortBy, String sortDir) {
                Pageable pageable = createPageable(page, size, sortBy, sortDir);
                Page<Product> productPage = productRepository.search(query, minPrice, maxPrice, pageable);
                return mapToPageResponse(productPage);
        }

        public ProductResponse getProductBySlug(String slug) {
                try {
                        Product product = productRepository.findBySlug(slug)
                                        .orElseThrow(() -> new RuntimeException("Product not found: " + slug));

                        List<ProductImage> images = productImageRepository
                                        .findByProductIdOrderBySortOrderAsc(product.getId());
                        List<ProductVariant> variants = productVariantRepository.findByProductId(product.getId());

                        return mapToProductResponse(product, images, variants);
                } catch (Exception e) {
                        e.printStackTrace();
                        throw e;
                }
        }

        public List<ProductListResponse> getFeaturedProducts() {
                return productRepository.findByIsFeaturedTrueAndIsActiveTrue().stream()
                                .map(this::mapToProductListResponse)
                                .collect(Collectors.toList());
        }

        public List<ProductListResponse> getNewArrivals() {
                return productRepository.findByIsNewTrueAndIsActiveTrue().stream()
                                .map(this::mapToProductListResponse)
                                .collect(Collectors.toList());
        }

        public List<ProductListResponse> getProductsOnSale() {
                return productRepository.findProductsOnSale().stream()
                                .map(this::mapToProductListResponse)
                                .collect(Collectors.toList());
        }

        private Pageable createPageable(int page, int size, String sortBy, String sortDir) {
                Sort sort = "desc".equalsIgnoreCase(sortDir)
                                ? Sort.by(sortBy).descending()
                                : Sort.by(sortBy).ascending();
                return PageRequest.of(page, size, sort);
        }

        private PageResponse<ProductListResponse> mapToPageResponse(Page<Product> productPage) {
                List<ProductListResponse> content = productPage.getContent().stream()
                                .map(this::mapToProductListResponse)
                                .collect(Collectors.toList());

                return PageResponse.<ProductListResponse>builder()
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

        private ProductListResponse mapToProductListResponse(Product product) {
                String mainImageUrl = product.getImages().stream()
                                .filter(ProductImage::getIsMain)
                                .findFirst()
                                .map(ProductImage::getUrl)
                                .orElse(product.getImages().isEmpty() ? null : product.getImages().get(0).getUrl());

                List<String> materials = productVariantRepository.findDistinctMaterialsByProductId(product.getId());
                List<String> colors = productVariantRepository.findDistinctColorsByProductId(product.getId());

                boolean isLowStock = product.getVariants().stream()
                                .anyMatch(v -> v.getStock() > 0 && v.getStock() <= product.getLowStockThreshold());

                Double avgRating = reviewRepository.getAverageRating(product.getId());
                long reviewCount = reviewRepository.countApprovedByProductId(product.getId());

                List<ProductListResponse.ColorInfo> colorInfos = product.getVariants().stream()
                                .filter(v -> v.getColor() != null)
                                .map(v -> ProductListResponse.ColorInfo.builder()
                                                .name(v.getColor())
                                                .hex(v.getColorHex())
                                                .build())
                                .distinct()
                                .collect(Collectors.toList());

                List<ProductListResponse.SimpleMaterial> simpleMaterials = product.getVariants().stream()
                                .filter(v -> !Boolean.FALSE.equals(v.getIsActive()))
                                .map(v -> ProductListResponse.SimpleMaterial.builder()
                                                .id(v.getId())
                                                .sku(v.getSku())
                                                .stock(v.getStock())
                                                .build())
                                .collect(Collectors.toList());

                return ProductListResponse.builder()
                                .id(product.getId())
                                .name(product.getName())
                                .basePrice(product.getBasePrice())
                                .salePrice(product.getSalePrice())
                                .currentPrice(product.getCurrentPrice())
                                .slug(product.getSlug())
                                .isFeatured(product.getIsFeatured())
                                .isNew(product.getIsNew())
                                .isOnSale(product.isOnSale())
                                .discountPercentage(product.getDiscountPercentage())
                                .mainImageUrl(mainImageUrl)
                                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                                .averageRating(avgRating)
                                .reviewCount(reviewCount)
                                .isLowStock(isLowStock)
                                .availableMaterials(materials)
                                .availableColors(colorInfos)
                                .materials(simpleMaterials)
                                .build();
        }

        private ProductResponse mapToProductResponse(Product product, List<ProductImage> imagesList,
                        List<ProductVariant> variantsList) {
                Double avgRating = reviewRepository.getAverageRating(product.getId());
                long reviewCount = reviewRepository.countApprovedByProductId(product.getId());

                String mainImageUrl = imagesList.stream()
                                .filter(img -> Boolean.TRUE.equals(img.getIsMain()))
                                .findFirst()
                                .map(ProductImage::getUrl)
                                .orElse(imagesList.isEmpty() ? null : imagesList.get(0).getUrl());

                List<ProductResponse.MaterialInfo> materials = variantsList.stream()
                                .filter(v -> !Boolean.FALSE.equals(v.getIsActive()))
                                .map(v -> mapToMaterialInfo(v, product))
                                .collect(Collectors.toList());

                List<ProductResponse.ImageInfo> images = imagesList.stream()
                                .map(this::mapToImageInfo)
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

        private ProductResponse mapToProductResponse(Product product) {
                List<ProductImage> images = productImageRepository.findByProductIdOrderBySortOrderAsc(product.getId());
                List<ProductVariant> variants = productVariantRepository.findByProductId(product.getId());
                return mapToProductResponse(product, images, variants);
        }

        private ProductResponse.MaterialInfo mapToMaterialInfo(ProductVariant variant, Product product) {
                BigDecimal finalPrice = product.getCurrentPrice().add(
                                variant.getPriceAdjustment() != null ? variant.getPriceAdjustment() : BigDecimal.ZERO);
                boolean isLowStock = variant
                                .getStock() <= (product.getLowStockThreshold() != null ? product.getLowStockThreshold() : 5);
                boolean isOutOfStock = variant.getStock() <= 0;

                return ProductResponse.MaterialInfo.builder()
                                .id(variant.getId())
                                .sku(variant.getSku())
                                .material(variant.getMaterial())
                                .color(variant.getColor())
                                .colorHex(variant.getColorHex())
                                .stock(variant.getStock())
                                .priceAdjustment(variant.getPriceAdjustment())
                                .finalPrice(finalPrice)
                                .isLowStock(isLowStock)
                                .isOutOfStock(isOutOfStock)
                                .isActive(variant.getIsActive())
                                .estimatedPrintMinutes(variant.getEstimatedPrintMinutes())
                                .weightGrams(variant.getWeightGrams())
                                .infillOptions(variant.getInfillOptions())
                                .layerHeightOptions(variant.getLayerHeightOptions())
                                .requiresSupport(variant.getRequiresSupport())
                                .postProcessing(variant.getPostProcessing())
                                .dimensionalAccuracy(variant.getDimensionalAccuracy())
                                .printTechnology(variant.getPrintTechnology())
                                .stlSpecs(variant.getStlSpecs())
                                .build();
        }

        private ProductResponse.ImageInfo mapToImageInfo(ProductImage image) {
                return ProductResponse.ImageInfo.builder()
                                .id(image.getId())
                                .url(image.getUrl())
                                .altText(image.getAltText())
                                .isMain(image.getIsMain())
                                .mediaType(image.getMediaType() != null ? image.getMediaType().name() : "IMAGE")
                                .build();
        }
}
