package com.dazehaze.dto.shipping.envioclick;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class EnvioClickShipmentResponse {

    private String status;

    @JsonProperty("status_codes")
    private Object statusCodes;

    @JsonProperty("status_messages")
    private Object statusMessages;

    private ShipmentData data;

    @Data
    public static class ShipmentData {
        private Long idOrder;
        private Long idShipmentOrder;
        private String trackingNumber;
        private String label;
        private String labelFormat;
        private String carrier;
        private String product;
        private Double total;
        private String pickupDate;
        private Boolean pickup;
    }
}
