package com.dazehaze.dto.shipping;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO for Envia.com Generate Label API
 * POST https://api.envia.com/ship/generate/
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class EnviaGenerateResponse {

    private String meta;
    private List<ShipmentData> data;
    private ErrorInfo error;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ErrorInfo {
        private Integer code;
        private String description;
        private String message;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ShipmentData {
        private String carrier;
        private String service;
        private Long shipmentId;
        private String trackingNumber;
        private String trackUrl;
        private String label; // URL to download the label PDF
        private Double totalPrice;
        private String currency;
    }
}
