package com.dazehaze.dto.shipping;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Simplified shipping rate DTO for frontend consumption
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShippingRateDTO {
    private String id;
    private String provider; // FEDEX, DHL, ESTAFETA, etc.
    private String serviceName; // "Express", "Standard", etc.
    private String serviceCode;
    private Integer estimatedDays;
    private BigDecimal price;
    private String currency; // MXN
}
