package com.dazehaze.dto.shipping;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

/**
 * Response DTO for Envia.com Rate API
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class EnviaRateResponse {

    private String meta;
    private List<RateData> data;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class RateData {
        private Integer carrierId;
        private String carrier;
        private String carrierDescription;

        private Integer serviceId;
        private String service;
        private String serviceDescription;

        @JsonProperty("deliveryEstimate")
        private String deliveryEstimate; // "3-5 business days"

        @JsonProperty("deliveryDate")
        private DeliveryDate deliveryDate;

        @JsonProperty("totalPrice")
        private String totalPrice; // "185.20"

        private String currency; // "MXN"

        private Double insurance;
        private Double additionalCharges;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class DeliveryDate {
        private String date;
        private String timeUnit;
        private Integer dateDifference;
    }
}
