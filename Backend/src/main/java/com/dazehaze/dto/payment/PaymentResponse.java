package com.dazehaze.dto.payment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {
    private String paymentId;
    private String status; // PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED
    private String paymentMethod;
    private BigDecimal amount;
    private String currency;
    private String transactionId;
    private LocalDateTime createdAt;
    private LocalDateTime paidAt;

    // For Stripe
    private String stripeClientSecret;
    private String stripePaymentIntentId;

    // For PayPal
    private String paypalApprovalUrl;
    private String paypalOrderId;

    private String errorMessage;
}
