package com.dazehaze.dto.shipping;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Result object for Envia shipment creation
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShipmentResult {
    private boolean success;
    private String trackingNumber;
    private String trackingUrl;
    private String labelUrl;
    private Long shipmentId;
    private String carrier;
    private String service;
    private String errorMessage;
}
