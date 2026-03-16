package com.dazehaze.controller;

import com.dazehaze.dto.order.CheckoutRequest;
import com.dazehaze.dto.shipping.ShippingRateDTO;
import com.dazehaze.dto.shipping.TrackingResponse;
import com.dazehaze.entity.Cart;
import com.dazehaze.entity.Order;
import com.dazehaze.entity.User;
import com.dazehaze.repository.OrderRepository;
import com.dazehaze.repository.UserRepository;
import com.dazehaze.service.CartService;
import com.dazehaze.service.EnviaShippingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shipping")
@RequiredArgsConstructor
@Slf4j
public class ShippingController {

    private final EnviaShippingService enviaShippingService;
    private final CartService cartService;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    @PostMapping("/rates")
    public ResponseEntity<List<ShippingRateDTO>> getShippingRates(
            @RequestBody CheckoutRequest request,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId) {

        String maskedPostalCode = request.getShippingPostalCode() != null
                && request.getShippingPostalCode().length() > 2
                        ? "***" + request.getShippingPostalCode()
                                .substring(request.getShippingPostalCode().length() - 2)
                        : "***";
        log.info("Calculating shipping rates for postal code: {}", maskedPostalCode);

        // Get user ID if authenticated
        Long userId = null;
        if (userDetails != null) {
            User user = userRepository.findByEmail(userDetails.getUsername())
                    .orElse(null);
            if (user != null) {
                userId = user.getId();
            }
        }

        // Need either user or session
        if (userId == null && sessionId == null) {
            log.warn("No user ID or session ID provided");
            return ResponseEntity.badRequest().build();
        }

        // Get cart to calculate parcel weight
        Cart cart = cartService.getCartEntity(userId, sessionId);
        if (cart == null || cart.getItems().isEmpty()) {
            log.warn("Cannot calculate shipping: cart is empty");
            return ResponseEntity.badRequest().build();
        }

        // Get rates from Envia.com
        List<ShippingRateDTO> rates = enviaShippingService.getShippingRates(
                request.getShippingStreet(),
                request.getShippingCity(),
                request.getShippingState(),
                request.getShippingPostalCode(),
                request.getShippingCountry(),
                cart.getItems());

        log.info("Found {} shipping rates", rates.size());
        return ResponseEntity.ok(rates);
    }

    /**
     * Track a shipment by tracking number
     * Public endpoint - no authentication required
     */
    @GetMapping("/track")
    public ResponseEntity<TrackingResponse> trackShipment(
            @RequestParam String trackingNumber,
            @RequestParam String carrier) {

        log.info("Tracking request: {} with carrier: {}", trackingNumber, carrier);

        if (trackingNumber == null || trackingNumber.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        if (carrier == null || carrier.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        TrackingResponse tracking = enviaShippingService.trackShipment(trackingNumber, carrier);
        return ResponseEntity.ok(tracking);
    }

    /**
     * Track shipment by order number
     * Public endpoint - no authentication required
     */
    @GetMapping("/track/order/{orderNumber}")
    public ResponseEntity<TrackingResponse> trackOrder(
            @PathVariable String orderNumber) {

        log.info("Tracking request for order: {}", orderNumber);

        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElse(null);

        if (order == null) {
            return ResponseEntity.notFound().build();
        }

        String trackingNumber = order.getTrackingNumber();
        String carrier = order.getCarrier();

        if (trackingNumber == null || trackingNumber.isBlank()) {
            return ResponseEntity.ok(TrackingResponse.builder()
                    .success(false)
                    .trackingNumber(null)
                    .carrier(null)
                    .errorMessage("Este pedido no tiene número de seguimiento asignado")
                    .build());
        }

        if (carrier == null || carrier.isBlank()) {
            return ResponseEntity.ok(TrackingResponse.builder()
                    .success(false)
                    .trackingNumber(trackingNumber)
                    .carrier(null)
                    .errorMessage("Este pedido no tiene transportista asignado")
                    .build());
        }

        TrackingResponse tracking = enviaShippingService.trackShipment(trackingNumber, carrier);
        return ResponseEntity.ok(tracking);
    }

    /**
     * Verify delivery status and auto-update order if delivered
     * For admin use
     */
    @PostMapping("/track/verify-delivery/{orderId}")
    public ResponseEntity<?> verifyDelivery(@PathVariable Long orderId) {
        log.info("Verifying delivery for order: {}", orderId);

        Order order = orderRepository.findById(orderId)
                .orElse(null);

        if (order == null) {
            return ResponseEntity.notFound().build();
        }

        String trackingNumber = order.getTrackingNumber();
        String carrier = order.getCarrier();

        if (trackingNumber == null || trackingNumber.isBlank()) {
            return ResponseEntity.badRequest().body("Order has no tracking number");
        }

        if (carrier == null || carrier.isBlank()) {
            return ResponseEntity.badRequest().body("Order has no carrier");
        }

        TrackingResponse tracking = enviaShippingService.trackShipment(trackingNumber, carrier);

        if (!tracking.isSuccess()) {
            return ResponseEntity.ok(tracking);
        }

        // Check if delivered
        String status = tracking.getCurrentStatus();
        boolean isDelivered = status != null && (
                status.toLowerCase().contains("delivered") ||
                status.toLowerCase().contains("entregado") ||
                status.toLowerCase().contains("entrega"));

        if (isDelivered && order.getStatus() != Order.OrderStatus.DELIVERED) {
            order.setStatus(Order.OrderStatus.DELIVERED);
            order.setDeliveredAt(java.time.LocalDateTime.now());
            orderRepository.save(order);
            log.info("Order {} automatically marked as DELIVERED", order.getOrderNumber());
            return ResponseEntity.ok().body("Order marked as DELIVERED");
        }

        return ResponseEntity.ok(tracking);
    }
}
