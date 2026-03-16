package com.dazehaze.controller;

import com.dazehaze.service.StripePaymentService;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.net.Webhook;
import com.stripe.param.PaymentIntentRetrieveParams;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Webhook Controller for Stripe Payments
 * 
 * Configure webhooks in Stripe Dashboard:
 * https://dashboard.stripe.com/webhooks
 * 
 * Endpoint: https://yourdomain.com/api/webhooks/stripe
 * Events: payment_intent.succeeded, payment_intent.payment_failed,
 * charge.refunded
 */
@RestController
@RequestMapping("/api/webhooks")
@RequiredArgsConstructor
@Slf4j
public class WebhookController {

    private final StripePaymentService stripePaymentService;

    @Value("${stripe.webhook-secret:whsec_placeholder}")
    private String webhookSecret;

    /**
     * Stripe Webhook Handler
     * Receives payment events from Stripe
     */
    @PostMapping("/stripe")
    public ResponseEntity<String> handleStripeWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {

        log.info("Received Stripe webhook");

        try {
            if (webhookSecret == null || webhookSecret.contains("placeholder")) {
                log.error("CRITICAL: Stripe webhook secret not configured. Rejecting webhook.");
                return ResponseEntity.status(500).body("Webhook secret configuration error");
            }

            Event event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
            log.info("Stripe event type: {}", event.getType());

            switch (event.getType()) {
                case "payment_intent.succeeded":
                    handlePaymentIntentSucceeded(event);
                    break;

                case "payment_intent.payment_failed":
                    handlePaymentIntentFailed(event);
                    break;

                case "charge.refunded":
                    handleChargeRefunded(event);
                    break;

                case "checkout.session.completed":
                    handleCheckoutSessionCompleted(event);
                    break;

                default:
                    log.info("Unhandled Stripe event type: {}", event.getType());
            }

            log.info("Stripe webhook processed successfully");
            return ResponseEntity.ok("Received");

        } catch (Exception e) {
            log.error("Error processing Stripe webhook", e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    /**
     * Handle payment_intent.succeeded event
     * Payment was successful - update order to PAID
     */
    private void handlePaymentIntentSucceeded(Event event) {
        log.info("Processing payment_intent.succeeded event");

        try {
            PaymentIntent paymentIntent = (PaymentIntent) event.getDataObjectDeserializer()
                    .getObject()
                    .orElseThrow(() -> new RuntimeException("PaymentIntent not found in event"));

            String paymentIntentId = paymentIntent.getId();
            log.info("PaymentIntent succeeded: {}", paymentIntentId);

            stripePaymentService.handlePaymentSuccess(paymentIntentId);
            log.info("Order updated to PAID for PaymentIntent: {}", paymentIntentId);

        } catch (Exception e) {
            log.error("Error handling payment_intent.succeeded", e);
        }
    }

    /**
     * Handle payment_intent.payment_failed event
     * Payment failed - update order to FAILED
     */
    private void handlePaymentIntentFailed(Event event) {
        log.info("Processing payment_intent.payment_failed event");

        try {
            PaymentIntent paymentIntent = (PaymentIntent) event.getDataObjectDeserializer()
                    .getObject()
                    .orElseThrow(() -> new RuntimeException("PaymentIntent not found in event"));

            String paymentIntentId = paymentIntent.getId();
            String failureMessage = paymentIntent.getLastPaymentError() != null
                    ? paymentIntent.getLastPaymentError().getMessage()
                    : "Payment failed";

            log.info("PaymentIntent failed: {} - Reason: {}", paymentIntentId, failureMessage);
            stripePaymentService.handlePaymentFailure(paymentIntentId, failureMessage);

        } catch (Exception e) {
            log.error("Error handling payment_intent.payment_failed", e);
        }
    }

    /**
     * Handle charge.refunded event
     * Payment was refunded - update order to REFUNDED
     */
    private void handleChargeRefunded(Event event) {
        log.info("Processing charge.refunded event");

        try {
            com.stripe.model.Charge charge = (com.stripe.model.Charge) event.getDataObjectDeserializer()
                    .getObject()
                    .orElseThrow(() -> new RuntimeException("Charge not found in event"));

            String paymentIntentId = charge.getPaymentIntent();
            log.info("Charge refunded: {} - PaymentIntent: {}", charge.getId(), paymentIntentId);

            stripePaymentService.handlePaymentRefunded(paymentIntentId);

        } catch (Exception e) {
            log.error("Error handling charge.refunded", e);
        }
    }

    /**
     * Handle checkout.session.completed event
     * Alternative event for successful payments via Stripe Checkout
     */
    private void handleCheckoutSessionCompleted(Event event) {
        log.info("Processing checkout.session.completed event");

        try {
            com.stripe.model.checkout.Session session = (com.stripe.model.checkout.Session) event
                    .getDataObjectDeserializer()
                    .getObject()
                    .orElseThrow(() -> new RuntimeException("Checkout Session not found in event"));

            String paymentIntentId = session.getPaymentIntent();
            log.info("Checkout session completed: {} - PaymentIntent: {}", session.getId(), paymentIntentId);

            if (paymentIntentId != null) {
                stripePaymentService.handlePaymentSuccess(paymentIntentId);
            }

        } catch (Exception e) {
            log.error("Error handling checkout.session.completed", e);
        }
    }

    // Raw backup handlers removed to enforce webhook signature verification.
}
