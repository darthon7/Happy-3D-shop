package com.dazehaze.dto.shipping.envioclick;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class EnvioClickQuotationResponse {

    private String status;

    @JsonProperty("status_codes")
    private Object statusCodes;

    @JsonProperty("status_messages")
    private Object statusMessages;

    @JsonProperty("data")
    private QuotationData data;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class QuotationData {
            private Insurance insurance;
            private Rate[] rates;
            private Object idCarriersNoWsResult;
            private String countryCode;
            @JsonProperty("package")
            private PackageInfo pkg;

            @JsonProperty("originZipCode")
            private String originZipCode;

            @JsonProperty("destinationZipCode")
            private String destinationZipCode;

        @Data
        public static class Insurance {
            private Double contentValue;
            private Double amountInsurance;
            private Double insurance;
        }

        @Data
        public static class Rate {
            private Long idRate;
            private Long idProduct;
            private String product;
            private String vehicle;
            private Long idCarrier;
            private String carrier;
            private Double total;
            private Integer deliveryDays;
            private String deliveryType;
            private String quotationType;
            private Object distance;
            private Boolean cod;
            private Object codDetails;
        }

        @Data
        public static class PackageInfo {
            private Double weight;
            private Double length;
            private Double height;
            private Double width;
        }
    }
}
