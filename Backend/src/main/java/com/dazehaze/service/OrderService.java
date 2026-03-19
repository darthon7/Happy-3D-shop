package com.dazehaze.service;

import com.dazehaze.dto.order.CancelOrderRequest;
import com.dazehaze.dto.order.CheckoutRequest;
import com.dazehaze.dto.order.OrderResponse;
import com.dazehaze.entity.*;
import com.dazehaze.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final CartService cartService;
    private final AddressRepository addressRepository;
    private final ProductVariantRepository productVariantRepository;
    private final CouponRepository couponRepository;
    private final ShippingService shippingService;
    private final OrderNotificationService orderNotificationService;
    private final StripePaymentService stripePaymentService;
    private final EnviaShippingService enviaShippingService;

    @Transactional
    public OrderResponse createOrder(Long userId, String sessionId, CheckoutRequest request) {
        Cart cart = getCart(userId, sessionId);

        if (cart.getItems().isEmpty()) {
            throw new RuntimeException("Cart is empty");
        }

        // Create shipping address
        Address shippingAddress = createAddress(
                request.getShippingStreet(),
                request.getShippingStreetLine2(),
                request.getShippingCity(),
                request.getShippingState(),
                request.getShippingPostalCode(),
                request.getShippingCountry(),
                Address.AddressType.SHIPPING,
                userId);

        // Create billing address
        Address billingAddress;
        if (request.getSameAsShipping() != null && request.getSameAsShipping()) {
            billingAddress = shippingAddress;
        } else {
            billingAddress = createAddress(
                    request.getBillingStreet(),
                    request.getBillingStreetLine2(),
                    request.getBillingCity(),
                    request.getBillingState(),
                    request.getBillingPostalCode(),
                    request.getBillingCountry(),
                    Address.AddressType.BILLING,
                    userId);
        }

        // Calculate shipping (from request)
        BigDecimal shippingCost = request.getShippingCost() != null ? request.getShippingCost() : BigDecimal.ZERO;
        BigDecimal total = cart.getTotal().add(shippingCost);

        // Create order
        Order order = Order.builder()
                .user(userId != null ? User.builder().id(userId).build() : null)
                .shippingAddress(shippingAddress)
                .billingAddress(billingAddress)
                .subtotal(cart.getSubtotal())
                .discount(cart.getDiscount())
                .shippingCost(shippingCost)
                .carrier(request.getCarrier())
                .serviceCode(request.getServiceCode())
                .serviceName(request.getServiceLevel())
                .shippingProvider(request.getShippingProvider())
                .tax(BigDecimal.ZERO)
                .total(total)
                .paymentMethod(Order.PaymentMethod.valueOf(request.getPaymentMethod().name()))
                .status(Order.OrderStatus.PENDING)
                .paymentStatus(Order.PaymentStatus.PENDING)
                .coupon(cart.getAppliedCoupon())
                .guestEmail(request.getGuestEmail())
                .guestPhone(request.getGuestPhone())
                .notes(request.getNotes())
                .build();

        // Create order items and update stock
        for (CartItem cartItem : cart.getItems()) {
            ProductVariant variant = cartItem.getProductVariant();

            // Check and update stock
            if (variant.getStock() < cartItem.getQuantity()) {
                throw new RuntimeException("Insufficient stock for: " + variant.getProduct().getName());
            }
            variant.setStock(variant.getStock() - cartItem.getQuantity());
            productVariantRepository.save(variant);

            String imageUrl = null;
            if (variant.getProduct().getImages() != null && !variant.getProduct().getImages().isEmpty()) {
                imageUrl = variant.getProduct().getImages().get(0).getUrl();
            }

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .productVariant(variant)
                    .productName(variant.getProduct().getName())
                    .productSku(variant.getSku())
                    .productMaterial(variant.getMaterial())
                    .productColor(variant.getColor())
                    .productImageUrl(imageUrl)
                    .quantity(cartItem.getQuantity())
                    .unitPrice(cartItem.getUnitPrice())
                    .totalPrice(cartItem.getTotalPrice())
                    .build();

            order.getItems().add(orderItem);
        }

        // Update coupon usage if applicable
        if (cart.getAppliedCoupon() != null) {
            Coupon coupon = cart.getAppliedCoupon();
            int currentCount = coupon.getUsedCount() != null ? coupon.getUsedCount() : 0;
            coupon.setUsedCount(currentCount + 1);
            couponRepository.save(coupon);
        }

        Order savedOrder = orderRepository.save(order);

        return mapToOrderResponse(savedOrder);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderByNumber(String orderNumber, Long userId) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderNumber));

        // Verify ownership
        if (order.getUser() != null && !order.getUser().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }

        return mapToOrderResponse(order);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getUserOrders(Long userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToOrderResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public OrderResponse cancelOrder(String orderNumber, Long userId, CancelOrderRequest cancelRequest) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

        // Verify ownership
        if (order.getUser() != null && !order.getUser().getId().equals(userId)) {
            throw new RuntimeException("Acceso denegado al pedido");
        }

        // Only allow cancellation in PENDING or CONFIRMED status
        if (order.getStatus() != Order.OrderStatus.PENDING &&
                order.getStatus() != Order.OrderStatus.CONFIRMED) {
            throw new IllegalStateException(
                    "No es posible cancelar el pedido en estado: " + order.getStatus() +
                            ". Solo se puede cancelar un pedido pendiente o confirmado.");
        }

        // 1. Cancel Envia shipping label if one was already generated
        if (order.getTrackingNumber() != null && !order.getTrackingNumber().isBlank()) {
            log.info("Cancelling Envia label for order {}: tracking={}", orderNumber, order.getTrackingNumber());
            boolean labelCancelled = enviaShippingService.cancelShipment(
                    order.getTrackingNumber(), order.getCarrier());
            if (labelCancelled) {
                log.info("Envia label cancelled for order {}", orderNumber);
            } else {
                log.warn("Could not cancel Envia label for order {} — manual void may be required", orderNumber);
            }
        }

        // 2. Issue Stripe refund if payment was made
        if (order.getPaymentStatus() == Order.PaymentStatus.PAID) {
            String paymentId = order.getPaymentId();
            if (paymentId != null && !paymentId.isBlank()) {
                log.info("Issuing Stripe refund for order {}: paymentId={}", orderNumber, paymentId);
                String refundId = stripePaymentService.refundPayment(paymentId);
                if (refundId != null) {
                    order.setPaymentStatus(Order.PaymentStatus.REFUNDED);
                    log.info("Stripe refund {} completed for order {}", refundId, orderNumber);
                } else {
                    log.warn("Stripe refund returned null for order {} — manual refund required via Stripe dashboard",
                            orderNumber);
                }
            } else {
                log.warn("Order {} is PAID but paymentId is null — manual refund required via Stripe dashboard",
                        orderNumber);
            }
        }

        // 3. Restore stock for all order items
        for (OrderItem item : order.getItems()) {
            ProductVariant variant = item.getProductVariant();
            if (variant != null) {
                variant.setStock(variant.getStock() + item.getQuantity());
                productVariantRepository.save(variant);
                log.info("Restored {} units of variant {} for order {}",
                        item.getQuantity(), variant.getId(), orderNumber);
            }
        }

        // 4. Record cancellation metadata
        order.setStatus(Order.OrderStatus.CANCELLED);
        order.setCancelledAt(LocalDateTime.now());
        order.setCancelledBy("CUSTOMER");
        if (cancelRequest != null) {
            order.setCancellationReason(cancelRequest.getReason());
            order.setCancellationDetails(cancelRequest.getDetails());
        }
        orderRepository.save(order);

        // 5. Notify customer if the order was actually processing/paid
        if (order.getPaymentStatus() != Order.PaymentStatus.PENDING) {
            try {
                orderNotificationService.notifyOrderCancelled(order);
            } catch (Exception e) {
                log.error("Failed to send cancellation notification for order {}: {}", orderNumber, e.getMessage());
            }
        }

        log.info("Order {} cancelled successfully by customer", orderNumber);
        return mapToOrderResponse(order);
    }

    // Helper methods
    private Cart getCart(Long userId, String sessionId) {
        if (userId != null) {
            return cartRepository.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("Cart not found"));
        } else {
            return cartRepository.findBySessionId(sessionId)
                    .orElseThrow(() -> new RuntimeException("Cart not found"));
        }
    }

    private Address createAddress(String street, String streetLine2, String city,
            String state, String postalCode, String country,
            Address.AddressType type, Long userId) {

        // If user is logged in, check for existing identical address to avoid
        // duplicates
        if (userId != null) {
            List<Address> existingAddresses = addressRepository.findByUserId(userId);
            for (Address existing : existingAddresses) {
                if (isSameAddress(existing, street, streetLine2, city, state, postalCode, country)) {
                    // Update type if needed or just return it.
                    // Note: If reusing, we prioritize returning the existing ID.
                    return existing;
                }
            }
        }

        Address address = Address.builder()
                .street(street)
                .streetLine2(streetLine2)
                .city(city)
                .state(state)
                .postalCode(postalCode)
                .country(country)
                .addressType(type)
                .user(userId != null ? User.builder().id(userId).build() : null)
                .build();
        return addressRepository.save(address);
    }

    private boolean isSameAddress(Address addr, String street, String streetLine2, String city,
            String state, String postalCode, String country) {
        return addr.getStreet().equalsIgnoreCase(street) &&
                equalsIgnoreNull(addr.getStreetLine2(), streetLine2) &&
                addr.getCity().equalsIgnoreCase(city) &&
                equalsIgnoreNull(addr.getState(), state) &&
                addr.getPostalCode().equalsIgnoreCase(postalCode) &&
                addr.getCountry().equalsIgnoreCase(country);
    }

    private boolean equalsIgnoreNull(String s1, String s2) {
        String str1 = s1 == null ? "" : s1;
        String str2 = s2 == null ? "" : s2;
        return str1.equalsIgnoreCase(str2);
    }

    private OrderResponse mapToOrderResponse(Order order) {
        List<OrderResponse.OrderItemResponse> items = order.getItems().stream()
                .map(this::mapToOrderItemResponse)
                .collect(Collectors.toList());

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
                .shippingAddress(mapToAddressInfo(order.getShippingAddress(), order))
                .billingAddress(mapToAddressInfo(order.getBillingAddress(), order))
                .items(items)
                .couponCode(order.getCoupon() != null ? order.getCoupon().getCode() : null)
                .build();
    }

    private OrderResponse.AddressInfo mapToAddressInfo(Address address, Order order) {
        if (address == null)
            return null;

        String recipientName = "Cliente";
        String phone = order.getGuestPhone();
        String email = order.getGuestEmail();

        if (address.getUser() != null) {
            recipientName = address.getUser().getFirstName() + " " + address.getUser().getLastName();
            if (phone == null)
                phone = address.getUser().getPhone();
            if (email == null)
                email = address.getUser().getEmail();
        } else if (order.getUser() != null) {
            recipientName = order.getUser().getFirstName() + " " + order.getUser().getLastName();
            if (phone == null)
                phone = order.getUser().getPhone();
            if (email == null)
                email = order.getUser().getEmail();
        }

        return OrderResponse.AddressInfo.builder()
                .recipientName(recipientName)
                .phone(phone)
                .email(email)
                .street(address.getStreet())
                .streetLine2(address.getStreetLine2())
                .city(address.getCity())
                .state(address.getState())
                .postalCode(address.getPostalCode())
                .country(address.getCountry())
                .build();
    }

    private OrderResponse.OrderItemResponse mapToOrderItemResponse(OrderItem item) {
        String imageUrl = item.getProductImageUrl();
        // Fallback for existing orders without stored image
        if (imageUrl == null && item.getProductVariant() != null && item.getProductVariant().getProduct() != null) {
            Product product = item.getProductVariant().getProduct();
            if (product.getImages() != null && !product.getImages().isEmpty()) {
                imageUrl = product.getImages().get(0).getUrl();
            }
        }

        Long pId = null;
        String pSlug = null;
        if (item.getProductVariant() != null && item.getProductVariant().getProduct() != null) {
            Product product = item.getProductVariant().getProduct();
            pId = product.getId();
            pSlug = product.getSlug();
        }

        return OrderResponse.OrderItemResponse.builder()
                .id(item.getId())
                .productId(pId)
                .productSlug(pSlug)
                .productName(item.getProductName())
                .productSku(item.getProductSku())
                .material(item.getProductMaterial())
                .color(item.getProductColor())
                .imageUrl(imageUrl)
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .totalPrice(item.getTotalPrice())
                .build();
    }
}
