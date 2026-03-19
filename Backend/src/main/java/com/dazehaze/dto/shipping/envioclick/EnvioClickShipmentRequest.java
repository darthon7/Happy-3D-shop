package com.dazehaze.dto.shipping.envioclick;

import lombok.Data;

@Data
public class EnvioClickShipmentRequest {

    private Long idRate;
    private String myShipmentReference;
    private Boolean requestPickup;
    private String pickupDate;
    private Boolean insurance;
    private Origin origin;
    private Destination destination;
    private ShipmentPackage shipmentPackage;

    @Data
    public static class Origin {
        private String company;
        private String rfc;
        private String firstName;
        private String lastName;
        private String email;
        private String phone;
        private String street;
        private String number;
        private String suburb;
        private String zipCode;
        private String reference;
    }

    @Data
    public static class Destination {
        private String company;
        private String rfc;
        private String firstName;
        private String lastName;
        private String email;
        private String phone;
        private String street;
        private String number;
        private String suburb;
        private String zipCode;
        private String reference;
    }

    @Data
    public static class ShipmentPackage {
        private String description;
        private Double contentValue;
        private Double weight;
        private Double length;
        private Double height;
        private Double width;
    }
}
