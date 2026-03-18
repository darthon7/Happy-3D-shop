package com.dazehaze.dto.order;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckoutRequest {
    // Shipping Address
    @NotBlank(message = "Street is required")
    private String shippingStreet;

    private String shippingStreetLine2;

    @NotBlank(message = "City is required")
    private String shippingCity;

    private String shippingState;

    @NotBlank(message = "Postal code is required")
    private String shippingPostalCode;

    @NotBlank(message = "Country is required")
    private String shippingCountry;

    // Billing Address (optional, defaults to shipping)
    private Boolean sameAsShipping = true;
    private String billingStreet;
    private String billingStreetLine2;
    private String billingCity;
    private String billingState;
    private String billingPostalCode;
    private String billingCountry;

    // Shipping Selection
    private java.math.BigDecimal shippingCost;
    private String carrier; // e.g. FedEx
    private String serviceLevel; // e.g. Standard (display name)
    private String serviceCode; // e.g. ground, express (API code for Envia)
    private String shippingProvider; // "envia" or "envioclick"

    // Payment
    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod;

    // Guest checkout fields
    private String guestEmail;
    private String guestPhone;

    // Notes
    private String notes;

    public enum PaymentMethod {
        STRIPE, PAYPAL, CASH_ON_DELIVERY
    }
}
