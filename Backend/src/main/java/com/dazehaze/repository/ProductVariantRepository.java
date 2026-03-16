package com.dazehaze.repository;

import com.dazehaze.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {
    List<ProductVariant> findByProductId(Long productId);

    Optional<ProductVariant> findBySku(String sku);

    boolean existsBySku(String sku);

    boolean existsBySkuAndProductIdNot(String sku, Long productId);

    List<ProductVariant> findByProductIdAndIsActiveTrue(Long productId);

    @Query("SELECT pv FROM ProductVariant pv WHERE pv.product.id = :productId AND pv.size = :size AND pv.color = :color")
    Optional<ProductVariant> findByProductAndSizeAndColor(
            @Param("productId") Long productId,
            @Param("size") String size,
            @Param("color") String color);

    @Query("SELECT DISTINCT pv.size FROM ProductVariant pv WHERE pv.product.id = :productId AND pv.isActive = true")
    List<String> findDistinctSizesByProductId(@Param("productId") Long productId);

    @Query("SELECT DISTINCT pv.color FROM ProductVariant pv WHERE pv.product.id = :productId AND pv.isActive = true")
    List<String> findDistinctColorsByProductId(@Param("productId") Long productId);
}
