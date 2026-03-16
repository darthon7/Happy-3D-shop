package com.dazehaze.dto.shipping;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for Envia.com Rate API
 * POST https://api-test.envia.com/ship/rate/
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class EnviaRateRequest {

    private AddressInfo origin;
    private AddressInfo destination;
    private List<Package> packages;
    private Shipment shipment;
    private Settings settings; // Required for /ship/generate/

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AddressInfo {
        private String name;
        private String company;
        private String email;
        private String phone;
        private String street;
        private String number;
        private String district;
        private String city;
        private String state;
        private String country;
        private String postalCode;
        private String reference;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Package {
        private String type; // "box"
        private String content; // "Clothing"
        private Integer amount; // 1
        private Double weight; // in KG
        private String weightUnit; // "KG"
        private String lengthUnit; // "CM"
        private Integer declaredValue;
        private Dimensions dimensions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Dimensions {
        private Integer length;
        private Integer width;
        private Integer height;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @com.fasterxml.jackson.annotation.JsonInclude(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL)
    public static class Shipment {
        private Integer type; // 1 = national
        private String carrier; // "fedex", "dhl", "estafeta", etc.
        private String service; // Service code like "ground", "express", etc. (only for /ship/generate/)
        private Integer dropOff; // 0=Door-to-door, 1=Branch-to-door, 2=Door-to-branch, 3=Branch-to-branch
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @com.fasterxml.jackson.annotation.JsonInclude(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL)
    public static class Settings {
        private String currency; // "MXN"
        private String labelFormat; // "pdf" or "zpl"
        private String printFormat; // "Letter" or "4x6"
        private String printSize; // "4x6", "Letter", etc.
        private String comments; // Optional comments
    }
}
