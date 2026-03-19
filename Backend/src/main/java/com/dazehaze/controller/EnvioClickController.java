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
import com.dazehaze.service.EnvioClickShippingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/shipping/envioclick")
@RequiredArgsConstructor
@Slf4j
public class EnvioClickController {

    private final EnvioClickShippingService envioClickShippingService;
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
        log.info("EnvioClick: Calculating shipping rates for postal code: {}", maskedPostalCode);

        Long userId = null;
        if (userDetails != null) {
            User user = userRepository.findByEmail(userDetails.getUsername()).orElse(null);
            if (user != null) {
                userId = user.getId();
            }
        }

        if (userId == null && sessionId == null) {
            log.warn("No user ID or session ID provided");
            return ResponseEntity.badRequest().build();
        }

        Cart cart = cartService.getCartEntity(userId, sessionId);
        if (cart == null || cart.getItems().isEmpty()) {
            log.warn("Cannot calculate EnvioClick shipping: cart is empty");
            return ResponseEntity.badRequest().build();
        }

        List<ShippingRateDTO> rates = envioClickShippingService.getShippingRates(
                request.getShippingStreet(),
                request.getShippingCity(),
                request.getShippingState(),
                request.getShippingPostalCode(),
                request.getShippingCountry(),
                cart.getItems());

        log.info("EnvioClick found {} shipping rates", rates.size());
        return ResponseEntity.ok(rates);
    }

    @GetMapping("/track")
    public ResponseEntity<TrackingResponse> trackShipment(
            @RequestParam String trackingNumber,
            @RequestParam String carrier) {

        log.info("EnvioClick tracking request: {} with carrier: {}", trackingNumber, carrier);

        if (trackingNumber == null || trackingNumber.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        if (carrier == null || carrier.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        TrackingResponse tracking = envioClickShippingService.trackShipment(trackingNumber, carrier);
        return ResponseEntity.ok(tracking);
    }

    @GetMapping("/track/order/{orderNumber}")
    public ResponseEntity<TrackingResponse> trackOrder(@PathVariable String orderNumber) {
        log.info("EnvioClick tracking request for order: {}", orderNumber);

        Order order = orderRepository.findByOrderNumber(orderNumber).orElse(null);
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

        TrackingResponse tracking = envioClickShippingService.trackShipment(trackingNumber, carrier);
        return ResponseEntity.ok(tracking);
    }

    @PostMapping("/track/verify-delivery/{orderId}")
    public ResponseEntity<?> verifyDelivery(@PathVariable Long orderId) {
        log.info("EnvioClick verifying delivery for order: {}", orderId);

        Order order = orderRepository.findById(orderId).orElse(null);
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

        TrackingResponse tracking = envioClickShippingService.trackShipment(trackingNumber, carrier);

        if (!tracking.isSuccess()) {
            return ResponseEntity.ok(tracking);
        }

        String status = tracking.getCurrentStatus();
        boolean isDelivered = status != null && (
                status.toLowerCase().contains("delivered") ||
                status.toLowerCase().contains("entregado") ||
                status.toLowerCase().contains("entrega"));

        if (isDelivered && order.getStatus() != Order.OrderStatus.DELIVERED) {
            order.setStatus(Order.OrderStatus.DELIVERED);
            order.setDeliveredAt(java.time.LocalDateTime.now());
            orderRepository.save(order);
            log.info("Order {} automatically marked as DELIVERED via EnvioClick", order.getOrderNumber());
            return ResponseEntity.ok().body("Order marked as DELIVERED");
        }

        return ResponseEntity.ok(tracking);
    }

    @PostMapping("/discover")
    public ResponseEntity<?> discoverEndpoints() {
        log.info("Starting EnvioClick endpoint discovery...");
        envioClickShippingService.discoverEndpoints();
        return ResponseEntity.ok(Map.of(
                "message", "Endpoint discovery complete. Check server logs for results.",
                "info", "Look for SUCCESS/FOUND log messages in the backend console"
        ));
    }
}
