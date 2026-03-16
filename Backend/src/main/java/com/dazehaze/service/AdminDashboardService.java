package com.dazehaze.service;

import com.dazehaze.dto.admin.DashboardResponse;
import com.dazehaze.entity.Order;
import com.dazehaze.repository.OrderRepository;
import com.dazehaze.repository.ProductRepository;
import com.dazehaze.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminDashboardService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public DashboardResponse getDashboard() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime startOfMonth = LocalDateTime.of(LocalDate.now().withDayOfMonth(1), LocalTime.MIN);

        // Revenue calculations
        BigDecimal totalRevenue = orderRepository.getTotalRevenue(LocalDateTime.of(2020, 1, 1, 0, 0), now);
        BigDecimal todayRevenue = orderRepository.getTotalRevenue(startOfDay, now);
        BigDecimal monthRevenue = orderRepository.getTotalRevenue(startOfMonth, now);

        // Order counts
        long totalOrders = orderRepository.count();
        long pendingOrders = orderRepository.countByStatus(Order.OrderStatus.PENDING);
        long shippedOrders = orderRepository.countByStatus(Order.OrderStatus.SHIPPED);
        long deliveredOrders = orderRepository.countByStatus(Order.OrderStatus.DELIVERED);

        // Product counts
        long totalProducts = productRepository.count();
        long activeProducts = productRepository.findByIsActiveTrue(org.springframework.data.domain.Pageable.unpaged())
                .getTotalElements();

        // User count
        long totalUsers = userRepository.count();

        // Recent orders
        List<DashboardResponse.RecentOrder> recentOrders = orderRepository.findAll(
                org.springframework.data.domain.PageRequest.of(0, 5,
                        org.springframework.data.domain.Sort.by("createdAt").descending()))
                .getContent().stream()
                .map(this::mapToRecentOrder)
                .collect(Collectors.toList());

        // Daily sales for last 7 days
        List<DashboardResponse.DailySales> dailySales = getDailySales(7);

        return DashboardResponse.builder()
                .totalRevenue(totalRevenue != null ? totalRevenue : BigDecimal.ZERO)
                .todayRevenue(todayRevenue != null ? todayRevenue : BigDecimal.ZERO)
                .monthRevenue(monthRevenue != null ? monthRevenue : BigDecimal.ZERO)
                .totalOrders(totalOrders)
                .pendingOrders(pendingOrders)
                .shippedOrders(shippedOrders)
                .deliveredOrders(deliveredOrders)
                .totalProducts(totalProducts)
                .activeProducts(activeProducts)
                .lowStockProducts(0L)
                .totalUsers(totalUsers)
                .recentOrders(recentOrders)
                .dailySales(dailySales)
                .build();
    }

    private List<DashboardResponse.DailySales> getDailySales(int days) {
        List<DashboardResponse.DailySales> dailySales = new ArrayList<>();
        LocalDate today = LocalDate.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM");

        for (int i = days - 1; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            LocalDateTime startOfDay = date.atStartOfDay();
            LocalDateTime endOfDay = date.atTime(23, 59, 59);

            List<Order> orders = orderRepository.findByDateRange(startOfDay, endOfDay);
            
            BigDecimal revenue = orders != null ? orders.stream()
                    .filter(o -> Order.PaymentStatus.PAID.equals(o.getPaymentStatus()))
                    .map(Order::getTotal)
                    .reduce(BigDecimal.ZERO, BigDecimal::add) : BigDecimal.ZERO;

            dailySales.add(DashboardResponse.DailySales.builder()
                    .date(date.format(formatter))
                    .revenue(revenue)
                    .orders(orders != null ? (long) orders.size() : 0L)
                    .build());
        }

        return dailySales;
    }

    private DashboardResponse.RecentOrder mapToRecentOrder(Order order) {
        String customerName = order.getUser() != null
                ? order.getUser().getFirstName() + " " + order.getUser().getLastName()
                : order.getGuestEmail();

        return DashboardResponse.RecentOrder.builder()
                .orderNumber(order.getOrderNumber())
                .customerName(customerName)
                .status(order.getStatus().name())
                .total(order.getTotal())
                .createdAt(order.getCreatedAt().toString())
                .build();
    }
}