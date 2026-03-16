package com.dazehaze.repository;

import com.dazehaze.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
        Optional<Order> findByOrderNumber(String orderNumber);

        Page<Order> findByUserId(Long userId, Pageable pageable);

        List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);

        Page<Order> findByStatus(Order.OrderStatus status, Pageable pageable);

        @Query("SELECT o FROM Order o WHERE o.createdAt BETWEEN :startDate AND :endDate")
        List<Order> findByDateRange(
                        @Param("startDate") LocalDateTime startDate,
                        @Param("endDate") LocalDateTime endDate);

        @Query("SELECT COUNT(o) FROM Order o WHERE o.status = :status")
        long countByStatus(@Param("status") Order.OrderStatus status);

        @Query("SELECT SUM(o.total) FROM Order o WHERE o.paymentStatus = 'PAID' AND o.createdAt BETWEEN :startDate AND :endDate")
        java.math.BigDecimal getTotalRevenue(
                        @Param("startDate") LocalDateTime startDate,
                        @Param("endDate") LocalDateTime endDate);

        long countByUserId(Long userId);

        List<Order> findByStatusAndPaidAtBefore(Order.OrderStatus status, LocalDateTime threshold);

        @Query("SELECT COUNT(o) FROM Order o JOIN o.items i WHERE o.user.id = :userId AND o.status = :status AND i.productVariant.product.id = :productId")
        long countPurchasedProductByUser(@Param("userId") Long userId, @Param("productId") Long productId,
                        @Param("status") Order.OrderStatus status);
}
