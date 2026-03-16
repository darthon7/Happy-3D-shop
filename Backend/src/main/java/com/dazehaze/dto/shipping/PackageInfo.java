package com.dazehaze.dto.shipping;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO containing calculated package information for shipping
 * Used to pass dynamic shipping data to Envia.com API
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PackageInfo {

    /**
     * Total weight in kilograms including packaging
     */
    private Double totalWeightKg;

    /**
     * Package length in centimeters
     */
    private Double lengthCm;

    /**
     * Package width in centimeters
     */
    private Double widthCm;

    /**
     * Package height in centimeters
     */
    private Double heightCm;

    /**
     * Declared value (sum of product prices)
     */
    private BigDecimal declaredValue;

    /**
     * Description of package contents
     */
    private String contentDescription;

    /**
     * Number of packages needed (if order is too large/heavy)
     */
    private Integer numberOfPackages;
}
