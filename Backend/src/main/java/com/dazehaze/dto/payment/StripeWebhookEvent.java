package com.dazehaze.dto.payment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StripeWebhookEvent {
    private String type;
    private String paymentIntentId;
    private String status;
    private Long amount;
    private String currency;
    private String receiptEmail;
}
