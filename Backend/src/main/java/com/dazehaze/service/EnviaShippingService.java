package com.dazehaze.service;

import com.dazehaze.dto.shipping.EnviaRateRequest;
import com.dazehaze.dto.shipping.EnviaRateResponse;
import com.dazehaze.dto.shipping.EnviaGenerateResponse;
import com.dazehaze.dto.shipping.ShippingRateDTO;
import com.dazehaze.dto.shipping.ShipmentResult;
import com.dazehaze.dto.shipping.TrackingResponse;
import com.dazehaze.entity.CartItem;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/**
 * Service for Envia.com shipping rate quotations
 * Docs: https://docs.envia.com/docs/quickstart
 */
@Service
@Slf4j
public class EnviaShippingService {

        @Value("${envia.api-key}")
        private String apiKey;

        @Value("${envia.api-url:https://api-test.envia.com}")
        private String apiUrl;

        // Warehouse configuration
        @Value("${envia.warehouse.name:Pruebas}")
        private String warehouseName;

        @Value("${envia.warehouse.street:Circonia 605}")
        private String warehouseStreet;

        @Value("${envia.warehouse.city:Torreon}")
        private String warehouseCity;

        @Value("${envia.warehouse.state:COA}")
        private String warehouseState;

        @Value("${envia.warehouse.postalCode:27054}")
        private String warehousePostalCode;

        @Value("${envia.warehouse.country:MX}")
        private String warehouseCountry;

        @Value("${envia.warehouse.district:Pedregal del Valle}")
        private String warehouseDistrict;

        @Value("${envia.warehouse.phone:8711038861}")
        private String warehousePhone;

        private final RestTemplate restTemplate = new RestTemplate();
        private final ObjectMapper objectMapper = new ObjectMapper();
        private final PackageCalculator packageCalculator;

        // Constructor injection
        public EnviaShippingService(PackageCalculator packageCalculator) {
                this.packageCalculator = packageCalculator;
        }

        // Carriers to query for rates
        private static final List<String> CARRIERS = Arrays.asList("fedex", "dhl", "estafeta", "ups", "redpack",
                        "jtexpress", "uber");

        /**
         * Get shipping rates from multiple carriers
         */
        public List<ShippingRateDTO> getShippingRates(
                        String destStreet,
                        String destCity,
                        String destState,
                        String destPostalCode,
                        String destCountry,
                        List<CartItem> items) {

                List<ShippingRateDTO> allRates = new ArrayList<>();

                // Query each carrier
                for (String carrier : CARRIERS) {
                        try {
                                List<ShippingRateDTO> carrierRates = getRatesForCarrier(
                                                carrier, destStreet, destCity, destState, destPostalCode, destCountry,
                                                items);
                                allRates.addAll(carrierRates);
                        } catch (Exception e) {
                                log.warn("Failed to get rates for carrier {}: {}", carrier, e.getMessage());
                        }
                }

                // Sort by price
                allRates.sort((a, b) -> a.getPrice().compareTo(b.getPrice()));

                log.info("Total shipping rates found: {}", allRates.size());
                return allRates;
        }

        private List<ShippingRateDTO> getRatesForCarrier(
                        String carrier,
                        String destStreet,
                        String destCity,
                        String destState,
                        String destPostalCode,
                        String destCountry,
                        List<CartItem> items) {

                // Build request
                EnviaRateRequest request = buildRequest(carrier, destStreet, destCity, destState, destPostalCode,
                                destCountry,
                                items);

                // Headers
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                headers.set("Authorization", "Bearer " + apiKey.trim());
                headers.set("User-Agent", "DazeHaze/1.0 (SpringBoot)");

                HttpEntity<EnviaRateRequest> entity = new HttpEntity<>(request, headers);

                log.debug("Calling Envia.com for carrier: {}", carrier);

                try {
                        // Get raw response first to debug
                        ResponseEntity<String> rawResponse = restTemplate.exchange(
                                        apiUrl + "/ship/rate/",
                                        HttpMethod.POST,
                                        entity,
                                        String.class);

                        log.info("Envia raw response for {}: {}", carrier, rawResponse.getBody());

                        // Parse response
                        if (rawResponse.getBody() != null) {
                                EnviaRateResponse response = objectMapper.readValue(rawResponse.getBody(),
                                                EnviaRateResponse.class);
                                if (response != null && response.getData() != null && !response.getData().isEmpty()) {
                                        log.info("Parsed {} rates for carrier {}", response.getData().size(), carrier);
                                        return mapToShippingRates(response.getData());
                                } else {
                                        log.warn("No rates in parsed response for carrier {}", carrier);
                                }
                        }
                } catch (HttpClientErrorException e) {
                        log.warn("Envia API error for {}: {} - {}", carrier, e.getStatusCode(),
                                        e.getResponseBodyAsString());
                } catch (Exception e) {
                        log.error("Error parsing Envia response for {}: {}", carrier, e.getMessage());
                }

                return Collections.emptyList();
        }

        private EnviaRateRequest buildRequest(
                        String carrier,
                        String destStreet,
                        String destCity,
                        String destState,
                        String destPostalCode,
                        String destCountry,
                        List<CartItem> items) {

                // Origin (warehouse)
                EnviaRateRequest.AddressInfo origin = EnviaRateRequest.AddressInfo.builder()
                                .name(warehouseName)
                                .company("")
                                .email("")
                                .phone(warehousePhone)
                                .street(warehouseStreet)
                                .number("")
                                .district(warehouseDistrict)
                                .city(warehouseCity)
                                .state(mapStateToCode(warehouseState))
                                .postalCode(warehousePostalCode)
                                .country(warehouseCountry)
                                .reference("")
                                .build();

                // Destination - convert country to ISO code
                String countryCode = convertCountryToIso(destCountry);

                EnviaRateRequest.AddressInfo destination = EnviaRateRequest.AddressInfo.builder()
                                .name("Customer")
                                .street(destStreet != null ? destStreet : "")
                                .city(destCity != null ? destCity : "")
                                .state(destState != null ? mapStateToCode(destState) : "")
                                .postalCode(destPostalCode)
                                .country(countryCode)
                                .build();

                // ✅ CALCULATE PACKAGE DYNAMICALLY from cart items
                com.dazehaze.dto.shipping.PackageInfo packageInfo = packageCalculator.calculatePackage(items);

                log.info("📦 Package calculated: weight={}kg, dims={}x{}x{}cm, value=${}",
                                packageInfo.getTotalWeightKg(),
                                packageInfo.getLengthCm(),
                                packageInfo.getWidthCm(),
                                packageInfo.getHeightCm(),
                                packageInfo.getDeclaredValue());

                // Package with DYNAMIC data
                EnviaRateRequest.Package pkg = EnviaRateRequest.Package.builder()
                                .type("box")
                                .content(packageInfo.getContentDescription()) // ✅ DYNAMIC
                                .amount(1)
                                .weight(packageInfo.getTotalWeightKg()) // ✅ DYNAMIC
                                .weightUnit("KG")
                                .lengthUnit("CM")
                                .declaredValue(packageInfo.getDeclaredValue().intValue()) // ✅ DYNAMIC
                                .dimensions(EnviaRateRequest.Dimensions.builder()
                                                .length(packageInfo.getLengthCm().intValue()) // ✅ DYNAMIC
                                                .width(packageInfo.getWidthCm().intValue()) // ✅ DYNAMIC
                                                .height(packageInfo.getHeightCm().intValue()) // ✅ DYNAMIC
                                                .build())
                                .build();

                // Shipment
                EnviaRateRequest.Shipment shipment = EnviaRateRequest.Shipment.builder()
                                .type(1) // national
                                .carrier(carrier)
                                .dropOff(0) // 0 = Door-to-door
                                .build();

                return EnviaRateRequest.builder()
                                .origin(origin)
                                .destination(destination)
                                .packages(Collections.singletonList(pkg))
                                .shipment(shipment)
                                .build();
        }

        private List<ShippingRateDTO> mapToShippingRates(List<EnviaRateResponse.RateData> rateDataList) {
                List<ShippingRateDTO> rates = new ArrayList<>();

                for (int i = 0; i < rateDataList.size(); i++) {
                        EnviaRateResponse.RateData data = rateDataList.get(i);

                        Integer days = 5; // default
                        if (data.getDeliveryDate() != null && data.getDeliveryDate().getDateDifference() != null) {
                                days = data.getDeliveryDate().getDateDifference();
                        }

                        rates.add(ShippingRateDTO.builder()
                                        .id("envia_" + data.getCarrier() + "_" + data.getService() + "_" + i)
                                        .provider(data.getCarrierDescription() != null ? data.getCarrierDescription()
                                                        : data.getCarrier().toUpperCase())
                                        .serviceName(
                                                        data.getServiceDescription() != null
                                                                        ? data.getServiceDescription()
                                                                        : data.getService())
                                        .serviceCode(data.getService())
                                        .estimatedDays(days)
                                        .price(new BigDecimal(
                                                        data.getTotalPrice() != null ? data.getTotalPrice() : "0"))
                                        .currency(data.getCurrency() != null ? data.getCurrency() : "MXN")
                                        .build());
                }

                return rates;
        }

        /**
         * Convert country name to ISO 2-letter code
         */
        private String convertCountryToIso(String country) {
                if (country == null || country.isEmpty()) {
                        return "MX";
                }
                String normalized = country.toLowerCase().trim();
                return switch (normalized) {
                        case "méxico", "mexico", "mx" -> "MX";
                        case "united states", "usa", "us", "estados unidos" -> "US";
                        case "canada", "canadá", "ca" -> "CA";
                        case "united kingdom", "uk", "gb", "reino unido" -> "GB";
                        default -> country.length() == 2 ? country.toUpperCase() : "MX";
                };
        }

        /**
         * Create a shipment in Envia.com and generate the shipping label
         * This should be called after payment is confirmed
         * 
         * @param order       The paid order
         * @param carrier     The carrier code (fedex, dhl, estafeta, ups)
         * @param serviceCode The service code (ground, express, etc.)
         * @return ShipmentResult with tracking number and label URL
         */
        public ShipmentResult createShipment(
                        com.dazehaze.entity.Order order,
                        String carrier,
                        String serviceCode) {

                log.info("Creating shipment for order {} with carrier {} service {}",
                                order.getOrderNumber(), carrier, serviceCode);

                // Build request with full address info including phone
                EnviaRateRequest.AddressInfo origin = EnviaRateRequest.AddressInfo.builder()
                                .name(warehouseName)
                                .company("")
                                .email("")
                                .phone(warehousePhone)
                                .street(warehouseStreet)
                                .number("")
                                .district(warehouseDistrict)
                                .city(warehouseCity)
                                .state(mapStateToCode(warehouseState))
                                .postalCode(warehousePostalCode)
                                .country(warehouseCountry)
                                .reference("")
                                .build();

                // Destination from order's shipping address
                com.dazehaze.entity.Address shippingAddr = order.getShippingAddress();
                String customerPhone = order.getGuestPhone() != null ? order.getGuestPhone() : "+52 5500000000";
                String customerName = shippingAddr.getUser() != null
                                ? shippingAddr.getUser().getFirstName() + " " + shippingAddr.getUser().getLastName()
                                : "Cliente";

                EnviaRateRequest.AddressInfo destination = EnviaRateRequest.AddressInfo.builder()
                                .name(customerName)
                                .company("")
                                .phone(customerPhone)
                                .email(order.getGuestEmail() != null ? order.getGuestEmail() : "")
                                .street(shippingAddr.getStreet())
                                .number("") // Required by Envia, even if empty
                                .district("")
                                .city(shippingAddr.getCity())
                                // ✅ Normalize state code for Envia
                                .state(mapStateToCode(shippingAddr.getState()))
                                .postalCode(shippingAddr.getPostalCode())
                                .country(convertCountryToIso(shippingAddr.getCountry()))
                                .reference("")
                                .build();

                log.info("📍 Address Mapping: Origin State '{}' -> '{}', Dest State '{}' -> '{}'",
                                warehouseState, mapStateToCode(warehouseState),
                                shippingAddr.getState(), mapStateToCode(shippingAddr.getState()));

                // ✅ Convert OrderItems to CartItems for PackageCalculator
                List<CartItem> cartItems = order.getItems().stream()
                                .map(orderItem -> {
                                        CartItem cartItem = new CartItem();
                                        cartItem.setProductVariant(orderItem.getProductVariant());
                                        cartItem.setQuantity(orderItem.getQuantity());
                                        return cartItem;
                                })
                                .collect(java.util.stream.Collectors.toList());

                // ✅ CALCULATE PACKAGE DYNAMICALLY
                com.dazehaze.dto.shipping.PackageInfo packageInfo = packageCalculator.calculatePackage(cartItems);

                log.info("📦 Shipment package: weight={}kg, dims={}x{}x{}cm, value=${}",
                                packageInfo.getTotalWeightKg(),
                                packageInfo.getLengthCm(),
                                packageInfo.getWidthCm(),
                                packageInfo.getHeightCm(),
                                packageInfo.getDeclaredValue());

                // Package with DYNAMIC data
                EnviaRateRequest.Package pkg = EnviaRateRequest.Package.builder()
                                .type("box")
                                .content(packageInfo.getContentDescription())
                                .amount(1)
                                .weight(packageInfo.getTotalWeightKg())
                                .weightUnit("KG")
                                .lengthUnit("CM")
                                .declaredValue(packageInfo.getDeclaredValue().intValue())
                                .dimensions(EnviaRateRequest.Dimensions.builder()
                                                .length(packageInfo.getLengthCm().intValue())
                                                .width(packageInfo.getWidthCm().intValue())
                                                .height(packageInfo.getHeightCm().intValue())
                                                .build())
                                .build();

                // Shipment with carrier and service
                EnviaRateRequest.Shipment shipment = EnviaRateRequest.Shipment.builder()
                                .type(1) // national
                                .carrier(carrier.toLowerCase())
                                .service(serviceCode)
                                .dropOff(0) // 0 = Door-to-door (no branch code required)
                                .build();

                // Settings required for /ship/generate/ endpoint
                EnviaRateRequest.Settings settings = EnviaRateRequest.Settings.builder()
                                .currency("MXN")
                                .labelFormat("PDF")
                                .printFormat("PDF")
                                .printSize("PAPER_LETTER")
                                .comments("Order: " + order.getOrderNumber())
                                .build();

                // Build main request
                EnviaRateRequest request = EnviaRateRequest.builder()
                                .origin(origin)
                                .destination(destination)
                                .shipment(shipment)
                                .packages(Collections.singletonList(pkg))
                                .settings(settings)
                                .build();

                // Call API
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                headers.set("Authorization", "Bearer " + apiKey.trim());
                headers.set("User-Agent", "DazeHaze/1.0 (SpringBoot)");

                HttpEntity<EnviaRateRequest> entity = new HttpEntity<>(request, headers);

                try {
                        log.info("Calling Envia.com to create label...");
                        log.info("Request payload: {}", objectMapper.writeValueAsString(request));

                        ResponseEntity<String> response = restTemplate.exchange(
                                        apiUrl + "/ship/generate/",
                                        HttpMethod.POST,
                                        entity,
                                        String.class);

                        log.info("Envia generate response: {}", response.getBody());

                        if (response.getBody() != null) {
                                com.dazehaze.dto.shipping.EnviaGenerateResponse genResponse = objectMapper.readValue(
                                                response.getBody(),
                                                com.dazehaze.dto.shipping.EnviaGenerateResponse.class);

                                // Check for error first
                                if (genResponse.getError() != null) {
                                        String errorMsg = genResponse.getError().getMessage() != null
                                                        ? genResponse.getError().getMessage()
                                                        : genResponse.getError().getDescription();
                                        log.error("Envia API returned error: {}", errorMsg);
                                        throw new RuntimeException("Envia API error: " + errorMsg);
                                }

                                // Check if we have success response
                                if ("generate".equals(genResponse.getMeta()) && genResponse.getData() != null
                                                && !genResponse.getData().isEmpty()) {
                                        com.dazehaze.dto.shipping.EnviaGenerateResponse.ShipmentData data = genResponse
                                                        .getData().get(0);
                                        log.info("✅ Shipment created successfully! Tracking: {}, Label: {}",
                                                        data.getTrackingNumber(), data.getLabel());
                                        return ShipmentResult.builder()
                                                        .success(true)
                                                        .trackingNumber(data.getTrackingNumber())
                                                        .trackingUrl(data.getTrackUrl())
                                                        .labelUrl(data.getLabel())
                                                        .shipmentId(data.getShipmentId())
                                                        .carrier(data.getCarrier())
                                                        .service(data.getService())
                                                        .build();
                                } else {
                                        log.error("Unexpected Envia response format. Meta: {}, Data: {}",
                                                        genResponse.getMeta(), genResponse.getData());
                                        throw new RuntimeException(
                                                        "Unexpected Envia response format: " + response.getBody());
                                }
                        } else {
                                throw new RuntimeException("Empty response from Envia API");
                        }
                } catch (HttpClientErrorException e) {
                        log.error("Envia API HTTP error: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
                        throw new RuntimeException("Envia API error: " + e.getResponseBodyAsString());
                } catch (RuntimeException e) {
                        throw e; // Re-throw RuntimeExceptions as-is
                } catch (Exception e) {
                        log.error("Error generating label: {}", e.getMessage(), e);
                        throw new RuntimeException("Error generating label: " + e.getMessage());
                }
        }

        /**
         * Map state codes to 2-letter format required by Envia.com API
         * Frontend sends 3-letter ISO codes (COA, MEX, CMX), but Envia requires
         * 2-letter codes
         * for carriers like Estafeta and DHL. UPS is more lenient but we use 2-letter
         * for all.
         */
        private String mapStateToCode(String stateName) {
                if (stateName == null || stateName.isEmpty())
                        return "";

                String cleanState = stateName.trim().toUpperCase();

                // Map 3-letter ISO codes (from frontend) to 2-letter Envia codes
                return switch (cleanState) {
                        case "AGU" -> "AG"; // Aguascalientes
                        case "BCN" -> "BC"; // Baja California
                        case "BCS" -> "BS"; // Baja California Sur
                        case "CAM" -> "CM"; // Campeche
                        case "CHP" -> "CS"; // Chiapas
                        case "CHH" -> "CH"; // Chihuahua
                        case "CMX" -> "DF"; // Ciudad de México (CDMX)
                        case "COA" -> "CO"; // Coahuila
                        case "COL" -> "CL"; // Colima
                        case "DUR" -> "DG"; // Durango
                        case "MEX" -> "EM"; // Estado de México
                        case "GUA" -> "GT"; // Guanajuato
                        case "GRO" -> "GR"; // Guerrero
                        case "HID" -> "HG"; // Hidalgo
                        case "JAL" -> "JA"; // Jalisco
                        case "MIC" -> "MI"; // Michoacán
                        case "MOR" -> "MO"; // Morelos
                        case "NAY" -> "NA"; // Nayarit
                        case "NLE" -> "NL"; // Nuevo León
                        case "OAX" -> "OA"; // Oaxaca
                        case "PUE" -> "PU"; // Puebla
                        case "QUE" -> "QT"; // Querétaro
                        case "ROO" -> "QR"; // Quintana Roo
                        case "SLP" -> "SL"; // San Luis Potosí
                        case "SIN" -> "SI"; // Sinaloa
                        case "SON" -> "SO"; // Sonora
                        case "TAB" -> "TB"; // Tabasco
                        case "TAM" -> "TM"; // Tamaulipas
                        case "TLA" -> "TL"; // Tlaxcala
                        case "VER" -> "VE"; // Veracruz
                        case "YUC" -> "YU"; // Yucatán
                        case "ZAC" -> "ZA"; // Zacatecas
                        // If already 2 letters, return as-is
                        default -> cleanState.length() == 2 ? cleanState
                                        : cleanState.length() >= 2 ? cleanState.substring(0, 2) : cleanState;
                };
        }

        /**
         * Track a shipment using Envia.com API
         * https://docs.envia.com/docs/tracking
         */
        public TrackingResponse trackShipment(String trackingNumber, String carrier) {
                log.info("Tracking shipment: {} with carrier: {}", trackingNumber, carrier);

                try {
                        String url = apiUrl + "/ship/track/";

                        String requestBody = String.format(
                                        "{\"trackingNumber\": \"%s\", \"carrier\": \"%s\"}",
                                        trackingNumber, carrier);

                        HttpHeaders headers = new HttpHeaders();
                        headers.setContentType(MediaType.APPLICATION_JSON);
                        headers.set("Authorization", apiKey);

                        HttpEntity<String> request = new HttpEntity<>(requestBody, headers);

                        ResponseEntity<String> response = restTemplate.postForEntity(
                                        url, request, String.class);

                        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                                return parseTrackingResponse(response.getBody(), trackingNumber, carrier);
                        }

                        return TrackingResponse.builder()
                                        .success(false)
                                        .trackingNumber(trackingNumber)
                                        .carrier(carrier)
                                        .errorMessage("Unable to get tracking information")
                                        .build();

                } catch (HttpClientErrorException e) {
                        log.error("Tracking API error: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
                        return TrackingResponse.builder()
                                        .success(false)
                                        .trackingNumber(trackingNumber)
                                        .carrier(carrier)
                                        .errorMessage("Tracking not found. The tracking number may be invalid or not yet registered.")
                                        .build();
                } catch (Exception e) {
                        log.error("Error tracking shipment: {}", e.getMessage(), e);
                        return TrackingResponse.builder()
                                        .success(false)
                                        .trackingNumber(trackingNumber)
                                        .carrier(carrier)
                                        .errorMessage("Error retrieving tracking: " + e.getMessage())
                                        .build();
                }
        }

        /**
         * Parse the tracking response from Envia API
         */
        private TrackingResponse parseTrackingResponse(String responseBody, String trackingNumber, String carrier) {
                try {
                        ObjectMapper mapper = new ObjectMapper();
                        com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(responseBody);

                        if (root.has("data") && root.get("data").isArray()) {
                                com.fasterxml.jackson.databind.JsonNode data = root.get("data").get(0);

                                if (data == null) {
                                        return TrackingResponse.builder()
                                                        .success(false)
                                                        .trackingNumber(trackingNumber)
                                                        .carrier(carrier)
                                                        .errorMessage("No tracking data found")
                                                        .build();
                                }

                                String currentStatus = data.has("status") ? data.get("status").asText() : "UNKNOWN";
                                String statusDescription = data.has("status_description")
                                                ? data.get("status_description").asText()
                                                : currentStatus;

                                List<TrackingResponse.TrackingEvent> events = new ArrayList<>();
                                if (data.has("track") && data.get("track").isArray()) {
                                        com.fasterxml.jackson.databind.JsonNode trackArray = data.get("track");
                                        for (com.fasterxml.jackson.databind.JsonNode eventNode : trackArray) {
                                                TrackingResponse.TrackingEvent event = TrackingResponse.TrackingEvent
                                                                .builder()
                                                                .status(eventNode.has("status")
                                                                                ? eventNode.get("status").asText()
                                                                                : "")
                                                                .description(eventNode.has("status_detail")
                                                                                ? eventNode.get("status_detail")
                                                                                                .asText()
                                                                                : "")
                                                                .location(eventNode.has("location")
                                                                                ? eventNode.get("location").asText()
                                                                                : "")
                                                                .date(eventNode.has("date") ? java.time.LocalDateTime
                                                                                .parse(eventNode.get("date").asText()
                                                                                                .replace(" ", "T"))
                                                                                : null)
                                                                .build();
                                                events.add(event);
                                        }
                                }

                                return TrackingResponse.builder()
                                                .success(true)
                                                .trackingNumber(trackingNumber)
                                                .carrier(carrier)
                                                .currentStatus(currentStatus)
                                                .currentStatusDescription(statusDescription)
                                                .events(events)
                                                .lastUpdate(events.isEmpty() ? null : events.get(0).getDate())
                                                .build();
                        }

                        return TrackingResponse.builder()
                                        .success(false)
                                        .trackingNumber(trackingNumber)
                                        .carrier(carrier)
                                        .errorMessage("Invalid tracking response format")
                                        .build();

                } catch (Exception e) {
                        log.error("Error parsing tracking response: {}", e.getMessage());
                        return TrackingResponse.builder()
                                        .success(false)
                                        .trackingNumber(trackingNumber)
                                        .carrier(carrier)
                                        .errorMessage("Error parsing tracking data")
                                        .build();
                }
        }

        /**
         * Cancel (void) a previously generated shipment label in Envia.com.
         * Must be called before the carrier physically picks up the package.
         *
         * @param trackingNumber The tracking number assigned by Envia
         * @param carrier        The carrier code (fedex, dhl, estafeta, ups)
         * @return true if cancellation was successful
         */
        public boolean cancelShipment(String trackingNumber, String carrier) {
                if (trackingNumber == null || trackingNumber.isBlank()) {
                        log.warn("cancelShipment called with null/blank trackingNumber — skipping.");
                        return false;
                }

                log.info("Cancelling Envia shipment for tracking: {} carrier: {}", trackingNumber, carrier);

                try {
                        String requestBody = String.format(
                                        "{\"trackingNumber\": \"%s\", \"carrier\": \"%s\"}",
                                        trackingNumber, carrier != null ? carrier : "");

                        HttpHeaders headers = new HttpHeaders();
                        headers.setContentType(MediaType.APPLICATION_JSON);
                        headers.set("Authorization", "Bearer " + apiKey.trim());
                        headers.set("User-Agent", "DazeHaze/1.0 (SpringBoot)");

                        HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);

                        ResponseEntity<String> response = restTemplate.exchange(
                                        apiUrl + "/ship/cancel/",
                                        HttpMethod.POST,
                                        entity,
                                        String.class);

                        log.info("Envia cancel response ({}): {}", response.getStatusCode(), response.getBody());

                        // Envia returns 200 with a success response when cancelled
                        if (response.getStatusCode() == HttpStatus.OK) {
                                log.info("✅ Shipment {} cancelled successfully in Envia", trackingNumber);
                                return true;
                        }

                        return false;

                } catch (HttpClientErrorException e) {
                        log.error("Envia cancel API error: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
                        // Don't throw — cancellation failure shouldn't block order cancellation
                        return false;
                } catch (Exception e) {
                        log.error("Error cancelling Envia shipment: {}", e.getMessage(), e);
                        return false;
                }
        }
}
