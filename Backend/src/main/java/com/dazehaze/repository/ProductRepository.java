package com.dazehaze.repository;

import com.dazehaze.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
        Optional<Product> findBySlug(String slug);

        boolean existsBySlug(String slug);

        Page<Product> findByIsActiveTrue(Pageable pageable);

        Page<Product> findByCategoryIdAndIsActiveTrue(Long categoryId, Pageable pageable);

        List<Product> findByIsFeaturedTrueAndIsActiveTrue();

        List<Product> findByIsNewTrueAndIsActiveTrue();

        @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.salePrice IS NOT NULL")
        List<Product> findProductsOnSale();

        @Query("SELECT p FROM Product p WHERE p.isActive = true AND " +
                        "(CAST(:q AS text) IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', CAST(:q AS text), '%')) OR LOWER(p.category.name) LIKE LOWER(CONCAT('%', CAST(:q AS text), '%'))) AND "
                        +
                        "(:categoryId IS NULL OR p.category.id = :categoryId) AND " +
                        "(CAST(:minPrice AS bigdecimal) IS NULL OR COALESCE(p.salePrice, p.basePrice) >= :minPrice) AND "
                        +
                        "(CAST(:maxPrice AS bigdecimal) IS NULL OR COALESCE(p.salePrice, p.basePrice) <= :maxPrice)")
        Page<Product> findWithFilters(
                        @Param("q") String query,
                        @Param("categoryId") Long categoryId,
                        @Param("minPrice") BigDecimal minPrice,
                        @Param("maxPrice") BigDecimal maxPrice,
                        Pageable pageable);

        @Query("SELECT p FROM Product p WHERE p.isActive = true AND " +
                        "(LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
                        "LOWER(p.category.name) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
                        "(:minPrice IS NULL OR COALESCE(p.salePrice, p.basePrice) >= :minPrice) AND " +
                        "(:maxPrice IS NULL OR COALESCE(p.salePrice, p.basePrice) <= :maxPrice)")
        Page<Product> search(@Param("query") String query,
                        @Param("minPrice") BigDecimal minPrice,
                        @Param("maxPrice") BigDecimal maxPrice,
                        Pageable pageable);

        long countByCategoryIdAndIsActiveTrue(Long categoryId);
}
