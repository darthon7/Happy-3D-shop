package com.dazehaze.service;

import com.dazehaze.dto.payment.PaymentResponse;
import com.dazehaze.dto.shipping.ShipmentResult;
import com.dazehaze.entity.Order;
import com.dazehaze.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Stripe Payment Service
 * 
 * To use this service, you need to:
 * 1. Create a Stripe account at https://stripe.com
 * 2. Get your API keys from the Stripe Dashboard
 * 3. Add the stripe-java dependency to pom.xml:
 * <dependency>
 * <groupId>com.stripe</groupId>
 * <artifactId>stripe-java</artifactId>
 * <version>24.0.0</version>
 * </dependency>
 * 4. Set environment variables:
 * STRIPE_SECRET_KEY=sk_test_xxx
 * STRIPE_WEBHOOK_SECRET=whsec_xxx
 */
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.net.Webhook;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.PaymentIntentRetrieveParams;

@Service
@RequiredArgsConstructor
@Slf4j
public class StripePaymentService {

    private final OrderRepository orderRepository;
    private final EnviaShippingService enviaShippingService;
    private final EnvioClickShippingService envioClickShippingService;
    private final OrderNotificationService orderNotificationService;
    private final CartService cartService;

    @Value("${stripe.secret-key:sk_test_placeholder}")
    private String stripeSecretKey;

    @Value("${stripe.webhook-secret:whsec_placeholder}")
    private String webhookSecret;

    /**
     * Creates a Stripe PaymentIntent for the order
     * Returns client_secret for frontend to complete payment
     */
    @Transactional
    public PaymentResponse createPaymentIntent(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        try {
            if (stripeSecretKey == null || stripeSecretKey.contains("placeholder")) {
                log.warn("Stripe Secret Key is missing or is placeholder. Using mock response.");
                return mockPaymentResponse(order);
            }

            Stripe.apiKey = stripeSecretKey;

            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount(order.getTotal().multiply(new BigDecimal("100")).longValue()) // Convert to cents
                    .setCurrency("mxn")
                    .setAutomaticPaymentMethods(
                            PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                    .setEnabled(true)
                                    .build())
                    .putMetadata("orderId", orderId.toString())
                    .build();

            PaymentIntent paymentIntent = PaymentIntent.create(params);

            return PaymentResponse.builder()
                    .paymentId(paymentIntent.getId())
                    .stripeClientSecret(paymentIntent.getClientSecret())
                    .stripePaymentIntentId(paymentIntent.getId())
                    .status("PENDING")
                    .amount(order.getTotal())
                    .currency("MXN")
                    .createdAt(LocalDateTime.now())
                    .build();
        } catch (Exception e) {
            log.error("Error creating Stripe PaymentIntent", e);
            throw new RuntimeException("Error communicating with payment provider");
        }
    }

    private PaymentResponse mockPaymentResponse(Order order) {
        log.info("Using MOCK PaymentIntent for order: {}", order.getId());
        return PaymentResponse.builder()
                .paymentId("pi_mock_" + order.getId())
                .stripeClientSecret("pi_mock_secret_" + order.getId())
                .stripePaymentIntentId("pi_mock_" + order.getId())
                .status("PENDING")
                .paymentMethod("STRIPE")
                .amount(order.getTotal())
                .currency("MXN")
                .createdAt(LocalDateTime.now())
                .errorMessage("Using MOCK mode. Configure Stripe keys to enable real payments.")
                .build();
    }

    /**
     * Confirms payment after successful Stripe webhook
     */
    @Transactional
    public void handlePaymentSuccess(String paymentIntentId) {
        log.info("Payment success for PaymentIntent: {}", paymentIntentId);

        try {
            Stripe.apiKey = stripeSecretKey;
            PaymentIntent paymentIntent = PaymentIntent.retrieve(paymentIntentId);

            if (!"succeeded".equals(paymentIntent.getStatus()) && !"processing".equals(paymentIntent.getStatus())) {
                log.warn("PaymentIntent {} is {}, not succeeded. Ignoring.", paymentIntentId, paymentIntent.getStatus());
                return;
            }

            if (paymentIntent.getMetadata() != null && paymentIntent.getMetadata().containsKey("orderId")) {
                String orderIdStr = paymentIntent.getMetadata().get("orderId");
                Long orderId = Long.parseLong(orderIdStr);

                Order order = orderRepository.findById(orderId)
                        .orElseThrow(() -> new RuntimeException("Order not found"));

                order.setPaymentStatus(Order.PaymentStatus.PAID);
                order.setPaidAt(LocalDateTime.now());
                order.setStatus(Order.OrderStatus.CONFIRMED);
                order.setPaymentId(paymentIntentId); // ← save PI id for future refunds
                orderRepository.save(order);

                // Send payment confirmation notification
                orderNotificationService.notifyPaymentConfirmed(order);

                // Clear cart for logged-in users
                if (order.getUser() != null) {
                    cartService.clearCart(order.getUser().getId(), null);
                }

                // Create shipment after payment is confirmed (Envia or EnvioClick)
                if (order.getCarrier() != null && order.getServiceCode() != null) {
                    try {
                        String provider = order.getShippingProvider();
                        log.info("Creating shipment for order {} using provider: {}", order.getOrderNumber(), provider);

                        ShipmentResult result;
                        if ("envioclick".equalsIgnoreCase(provider)) {
                            result = envioClickShippingService.createShipment(
                                    order,
                                    order.getCarrier(),
                                    order.getServiceCode());
                        } else {
                            result = enviaShippingService.createShipment(
                                    order,
                                    order.getCarrier(),
                                    order.getServiceCode());
                        }

                        if (result.isSuccess()) {
                            order.setTrackingNumber(result.getTrackingNumber());
                            order.setLabelUrl(result.getLabelUrl());
                            orderRepository.save(order);

                            log.info(
                                    "Shipment created successfully ({}). Tracking: {}. Status remains CONFIRMED.",
                                    provider, result.getTrackingNumber());
                        } else {
                            log.error("Failed to create shipment: {}", result.getErrorMessage());
                        }
                    } catch (Exception e) {
                        log.error("Error creating shipment in {}", order.getShippingProvider(), e);
                    }
                } else {
                    log.warn("Order {} has no carrier/serviceCode, skipping shipment creation",
                            order.getOrderNumber());
                }
            }
        } catch (Exception e) {
            log.error("Error handling payment success", e);
        }
    }

    /**
     * Validates Stripe webhook signature
     */
    public boolean validateWebhookSignature(String payload, String sigHeader) {
        try {
            if (webhookSecret == null || webhookSecret.contains("placeholder"))
                return true;

            Event event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
            return true;
        } catch (SignatureVerificationException e) {
            log.error("Invalid Stripe webhook signature");
            return false;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Handle payment failure from webhook
     */
    @Transactional
    public void handlePaymentFailure(String paymentIntentId, String failureReason) {
        log.info("Payment failed for PaymentIntent: {}, Reason: {}", paymentIntentId, failureReason);

        try {
            Stripe.apiKey = stripeSecretKey;

            PaymentIntentRetrieveParams params = PaymentIntentRetrieveParams.builder()
                    .addExpand("metadata")
                    .build();

            PaymentIntent paymentIntent = PaymentIntent.retrieve(paymentIntentId, params, null);

            if (paymentIntent.getMetadata() != null && paymentIntent.getMetadata().containsKey("orderId")) {
                String orderIdStr = paymentIntent.getMetadata().get("orderId");
                Long orderId = Long.parseLong(orderIdStr);

                Order order = orderRepository.findById(orderId)
                        .orElseThrow(() -> new RuntimeException("Order not found"));

                order.setPaymentStatus(Order.PaymentStatus.FAILED);
                order.setStatus(Order.OrderStatus.CANCELLED);
                orderRepository.save(order);

                log.info("Order {} updated to FAILED/CANCELLED", order.getOrderNumber());
            }
        } catch (Exception e) {
            log.error("Error handling payment failure", e);
        }
    }

    /**
     * Handle payment refund from webhook
     */
    @Transactional
    public void handlePaymentRefunded(String paymentIntentId) {
        log.info("Payment refunded for PaymentIntent: {}", paymentIntentId);

        try {
            Stripe.apiKey = stripeSecretKey;

            PaymentIntentRetrieveParams params = PaymentIntentRetrieveParams.builder()
                    .addExpand("metadata")
                    .build();

            PaymentIntent paymentIntent = PaymentIntent.retrieve(paymentIntentId, params, null);

            if (paymentIntent.getMetadata() != null && paymentIntent.getMetadata().containsKey("orderId")) {
                String orderIdStr = paymentIntent.getMetadata().get("orderId");
                Long orderId = Long.parseLong(orderIdStr);

                Order order = orderRepository.findById(orderId)
                        .orElseThrow(() -> new RuntimeException("Order not found"));

                order.setPaymentStatus(Order.PaymentStatus.REFUNDED);
                order.setStatus(Order.OrderStatus.REFUNDED);
                orderRepository.save(order);

                log.info("Order {} updated to REFUNDED", order.getOrderNumber());
            }
        } catch (Exception e) {
            log.error("Error handling payment refund", e);
        }
    }

    /**
     * Proactively issue a full refund via Stripe API.
     * Call this when a customer cancels a paid order.
     *
     * @param paymentIntentId Stripe PaymentIntent ID stored on the order
     * @return the Stripe Refund ID for audit purposes
     */
    public String refundPayment(String paymentIntentId) {
        if (paymentIntentId == null || paymentIntentId.startsWith("pi_mock_")) {
            log.warn("Skipping Stripe refund for mock/missing paymentId: {}", paymentIntentId);
            return null;
        }

        try {
            Stripe.apiKey = stripeSecretKey;

            com.stripe.param.RefundCreateParams params = com.stripe.param.RefundCreateParams.builder()
                    .setPaymentIntent(paymentIntentId)
                    .build();

            com.stripe.model.Refund refund = com.stripe.model.Refund.create(params);
            log.info("Stripe refund created: {} for PaymentIntent: {}", refund.getId(), paymentIntentId);
            return refund.getId();

        } catch (Exception e) {
            log.error("Error issuing Stripe refund for PaymentIntent: {}", paymentIntentId, e);
            // Don't throw — refund failure shouldn't block order cancellation
            return null;
        }
    }
}
