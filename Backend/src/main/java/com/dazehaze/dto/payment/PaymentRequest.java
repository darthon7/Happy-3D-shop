package com.dazehaze.dto.payment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRequest {
    private Long orderId;
    private String paymentMethod; // STRIPE, PAYPAL
    private BigDecimal amount;
    private String currency;

    // For Stripe
    private String stripePaymentMethodId;

    // For PayPal
    private String paypalOrderId;
}
