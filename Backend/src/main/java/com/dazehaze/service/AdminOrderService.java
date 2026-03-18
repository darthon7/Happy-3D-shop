package com.dazehaze.service;

import com.dazehaze.dto.admin.UpdateOrderStatusRequest;
import com.dazehaze.dto.common.PageResponse;
import com.dazehaze.dto.order.OrderResponse;
import com.dazehaze.entity.Order;
import com.dazehaze.entity.OrderStatusHistory;
import com.dazehaze.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminOrderService {

    private final OrderRepository orderRepository;
    private final OrderNotificationService orderNotificationService;

    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> getAllOrders(int page, int size, String status, String sortBy, String sortDir) {
        Sort sort = "desc".equalsIgnoreCase(sortDir) ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Order> orderPage;
        if (status != null && !status.isEmpty()) {
            Order.OrderStatus orderStatus = Order.OrderStatus.valueOf(status.toUpperCase());
            orderPage = orderRepository.findByStatus(orderStatus, pageable);
        } else {
            orderPage = orderRepository.findAll(pageable);
        }

        List<OrderResponse> content = orderPage.getContent().stream()
                .map(this::mapToOrderResponse)
                .collect(Collectors.toList());

        return PageResponse.<OrderResponse>builder()
                .content(content)
                .page(orderPage.getNumber())
                .size(orderPage.getSize())
                .totalElements(orderPage.getTotalElements())
                .totalPages(orderPage.getTotalPages())
                .isFirst(orderPage.isFirst())
                .isLast(orderPage.isLast())
                .hasNext(orderPage.hasNext())
                .hasPrevious(orderPage.hasPrevious())
                .build();
    }

    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, UpdateOrderStatusRequest request, String adminUser) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        Order.OrderStatus previousStatus = order.getStatus();
        Order.OrderStatus newStatus = Order.OrderStatus.valueOf(request.getStatus().name());

        // Validate status transition
        validateStatusTransition(previousStatus, newStatus);

        // Update order
        order.setStatus(newStatus);
        if (request.getTrackingNumber() != null) {
            order.setTrackingNumber(request.getTrackingNumber());
        }
        if (request.getCarrier() != null) {
            order.setCarrier(request.getCarrier());
        }
        if (request.getServiceName() != null) {
            order.setServiceName(request.getServiceName());
        }

        // Auto-set shipping dates when transitioning to SHIPPED
        if (newStatus == Order.OrderStatus.SHIPPED && order.getShippedAt() == null) {
            order.setShippedAt(LocalDateTime.now());
            if (request.getEstimatedDeliveryDays() != null) {
                order.setEstimatedDeliveryDate(
                        LocalDate.now().plusDays(request.getEstimatedDeliveryDays()));
            }
        }

        // Create status history entry
        OrderStatusHistory history = OrderStatusHistory.builder()
                .order(order)
                .previousStatus(previousStatus)
                .newStatus(newStatus)
                .notes(request.getNotes())
                .changedBy(adminUser)
                .build();
        order.getStatusHistory().add(history);

        orderRepository.save(order);

        // Send notification to customer
        orderNotificationService.notifyStatusChanged(order, previousStatus, newStatus);

        return mapToOrderResponse(order);
    }

    private void validateStatusTransition(Order.OrderStatus from, Order.OrderStatus to) {
        // Define valid transitions
        boolean valid = switch (from) {
            case PENDING -> to == Order.OrderStatus.CONFIRMED || to == Order.OrderStatus.CANCELLED;
            case CONFIRMED -> to == Order.OrderStatus.PROCESSING || to == Order.OrderStatus.CANCELLED;
            case PROCESSING -> to == Order.OrderStatus.SHIPPED || to == Order.OrderStatus.CANCELLED;
            case SHIPPED -> to == Order.OrderStatus.IN_TRANSIT || to == Order.OrderStatus.DELIVERED;
            case IN_TRANSIT -> to == Order.OrderStatus.DELIVERED;
            case DELIVERED -> to == Order.OrderStatus.RETURN_IN_PROGRESS || to == Order.OrderStatus.REFUNDED;
            case RETURN_IN_PROGRESS -> to == Order.OrderStatus.REFUNDED || to == Order.OrderStatus.DELIVERED;
            case CANCELLED, REFUNDED -> false;
        };

        if (!valid) {
            throw new IllegalStateException("Transición inválida: no se puede cambiar de " + from + " a " + to);
        }
    }

    private OrderResponse mapToOrderResponse(Order order) {
        List<OrderResponse.OrderItemResponse> items = order.getItems().stream()
                .map(item -> {
                    Long pId = null;
                    String pSlug = null;
                    if (item.getProductVariant() != null && item.getProductVariant().getProduct() != null) {
                        pId = item.getProductVariant().getProduct().getId();
                        pSlug = item.getProductVariant().getProduct().getSlug();
                    }
                    return OrderResponse.OrderItemResponse.builder()
                            .id(item.getId())
                            .productId(pId)
                            .productSlug(pSlug)
                            .productName(item.getProductName())
                            .productSku(item.getProductSku())
                            .material(item.getProductMaterial())
                            .color(item.getProductColor())
                            .imageUrl(item.getProductImageUrl())
                            .quantity(item.getQuantity())
                            .unitPrice(item.getUnitPrice())
                            .totalPrice(item.getTotalPrice())
                            .build();
                })
                .collect(Collectors.toList());

        OrderResponse.AddressInfo shippingInfo = null;
        if (order.getShippingAddress() != null) {
            String recipientName = "Cliente";
            String phone = order.getGuestPhone();
            String email = order.getGuestEmail();

            if (order.getShippingAddress().getUser() != null) {
                recipientName = order.getShippingAddress().getUser().getFirstName() + " "
                        + order.getShippingAddress().getUser().getLastName();
                if (phone == null)
                    phone = order.getShippingAddress().getUser().getPhone();
                if (email == null)
                    email = order.getShippingAddress().getUser().getEmail();
            } else if (order.getUser() != null) {
                recipientName = order.getUser().getFirstName() + " " + order.getUser().getLastName();
                if (phone == null)
                    phone = order.getUser().getPhone();
                if (email == null)
                    email = order.getUser().getEmail();
            }

            shippingInfo = OrderResponse.AddressInfo.builder()
                    .recipientName(recipientName)
                    .phone(phone)
                    .email(email)
                    .street(order.getShippingAddress().getStreet())
                    .streetLine2(order.getShippingAddress().getStreetLine2())
                    .city(order.getShippingAddress().getCity())
                    .state(order.getShippingAddress().getState())
                    .postalCode(order.getShippingAddress().getPostalCode())
                    .country(order.getShippingAddress().getCountry())
                    .build();
        }

        return OrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .status(order.getStatus().name())
                .paymentStatus(order.getPaymentStatus().name())
                .paymentMethod(order.getPaymentMethod() != null ? order.getPaymentMethod().name() : null)
                .subtotal(order.getSubtotal())
                .discount(order.getDiscount())
                .shippingCost(order.getShippingCost())
                .tax(order.getTax())
                .total(order.getTotal())
                .trackingNumber(order.getTrackingNumber())
                .carrier(order.getCarrier())
                .serviceName(order.getServiceName())
                .shippedAt(order.getShippedAt())
                .estimatedDeliveryDate(order.getEstimatedDeliveryDate())
                .createdAt(order.getCreatedAt())
                .paidAt(order.getPaidAt())
                .shippingAddress(shippingInfo)
                .items(items)
                .couponCode(order.getCoupon() != null ? order.getCoupon().getCode() : null)
                .build();
    }
}
