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

    @Query("SELECT DISTINCT pv.material FROM ProductVariant pv WHERE pv.product.id = :productId AND pv.isActive = true AND pv.material IS NOT NULL")
    List<String> findDistinctMaterialsByProductId(@Param("productId") Long productId);

    @Query("SELECT DISTINCT pv.color FROM ProductVariant pv WHERE pv.product.id = :productId AND pv.isActive = true AND pv.color IS NOT NULL")
    List<String> findDistinctColorsByProductId(@Param("productId") Long productId);
}
