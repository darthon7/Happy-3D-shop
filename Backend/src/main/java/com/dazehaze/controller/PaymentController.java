package com.dazehaze.controller;

import com.dazehaze.dto.payment.PaymentResponse;
import com.dazehaze.entity.Order;
import com.dazehaze.entity.User;
import com.dazehaze.repository.OrderRepository;
import com.dazehaze.repository.UserRepository;
import com.dazehaze.service.StripePaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final StripePaymentService stripePaymentService;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    /**
     * Create Stripe PaymentIntent
     * Frontend will use the client_secret to complete payment
     */
    @PostMapping("/stripe/create-intent/{orderId}")
    public ResponseEntity<PaymentResponse> createStripePaymentIntent(
            @PathVariable Long orderId,
            @AuthenticationPrincipal UserDetails userDetails) {
        verifyOrderOwnership(orderId, userDetails);
        PaymentResponse response = stripePaymentService.createPaymentIntent(orderId);
        return ResponseEntity.ok(response);
    }

    /**
     * Confirm Stripe payment after frontend payment completion
     */
    @PostMapping("/stripe/confirm/{paymentIntentId}")
    public ResponseEntity<String> confirmStripePayment(
            @PathVariable String paymentIntentId,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            stripePaymentService.handlePaymentSuccess(paymentIntentId);
            return ResponseEntity.ok("Payment confirmed and shipment created");
        } catch (Exception e) {
            log.error("Error confirming Stripe payment: {}", paymentIntentId, e);
            return ResponseEntity.badRequest().body("Error al confirmar el pago");
        }
    }

    /**
     * Verifica que el pedido pertenece al usuario autenticado.
     * Previene BOLA (Broken Object Level Authorization).
     */
    private void verifyOrderOwnership(Long orderId, UserDetails userDetails) {
        if (userDetails == null) {
            throw new IllegalArgumentException("Autenticación requerida");
        }
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Pedido no encontrado"));

        // Allow guest orders (no user) to be accessed by any authenticated user
        // but verify ownership for user-linked orders
        if (order.getUser() != null && !order.getUser().getId().equals(user.getId())) {
            log.warn("BOLA attempt: user {} tried to access order {} owned by user {}",
                    user.getId(), orderId, order.getUser().getId());
            throw new IllegalArgumentException("Acceso denegado al pedido");
        }
    }
}
