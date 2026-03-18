package com.dazehaze.service;

import com.dazehaze.dto.shipping.ShipmentResult;
import com.dazehaze.dto.shipping.ShippingRateDTO;
import com.dazehaze.dto.shipping.TrackingResponse;
import com.dazehaze.dto.shipping.envioclick.EnvioClickQuotationResponse;
import com.dazehaze.dto.shipping.envioclick.EnvioClickShipmentResponse;
import com.dazehaze.dto.shipping.envioclick.EnvioClickTrackResponse;
import com.dazehaze.entity.CartItem;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@Slf4j
public class EnvioClickShippingService {

    @Value("${envioclick.api-key}")
    private String apiKey;

    @Value("${envioclick.api-url:https://api.envioclickpro.com}")
    private String apiUrl;

    @Value("${envioclick.quotation-endpoint:/api/v2/quotation}")
    private String quotationEndpoint;

    @Value("${envioclick.shipment-endpoint:/api/v2/shipment}")
    private String shipmentEndpoint;

    @Value("${envioclick.track-endpoint:/api/v2/track}")
    private String trackEndpoint;

    @Value("${envioclick.cancel-endpoint:/api/v2/cancellation/batch/order}")
    private String cancelEndpoint;

    @Value("${envioclick.warehouse.name:DazeHaze}")
    private String warehouseName;

    @Value("${envioclick.warehouse.street:Circonia 605}")
    private String warehouseStreet;

    @Value("${envioclick.warehouse.city:Torreon}")
    private String warehouseCity;

    @Value("${envioclick.warehouse.state:COA}")
    private String warehouseState;

    @Value("${envioclick.warehouse.postalCode:27054}")
    private String warehousePostalCode;

    @Value("${envioclick.warehouse.country:MX}")
    private String warehouseCountry;

    @Value("${envioclick.warehouse.phone:8711038861}")
    private String warehousePhone;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final PackageCalculator packageCalculator;

    public EnvioClickShippingService(PackageCalculator packageCalculator) {
        this.packageCalculator = packageCalculator;
    }

    public List<ShippingRateDTO> getShippingRates(
            String destStreet,
            String destCity,
            String destState,
            String destPostalCode,
            String destCountry,
            List<CartItem> items) {

        com.dazehaze.dto.shipping.PackageInfo packageInfo = packageCalculator.calculatePackage(items);

        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("origin_zip_code", warehousePostalCode);
        requestBody.put("destination_zip_code", destPostalCode);

        Map<String, Object> pkg = new LinkedHashMap<>();
        pkg.put("weight", packageInfo.getTotalWeightKg());
        pkg.put("length", packageInfo.getLengthCm());
        pkg.put("width", packageInfo.getWidthCm());
        pkg.put("height", packageInfo.getHeightCm());
        pkg.put("description", packageInfo.getContentDescription());
        pkg.put("contentValue", packageInfo.getDeclaredValue().doubleValue());
        requestBody.put("package", pkg);

        HttpHeaders headers = buildHeaders();
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        log.info("EnvioClick: Fetching rates from {} (origin: {}, dest: {})",
                apiUrl + quotationEndpoint, warehousePostalCode, destPostalCode);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    apiUrl + quotationEndpoint,
                    HttpMethod.POST,
                    entity,
                    String.class);

            log.info("EnvioClick quotation response: {}", response.getBody());

            if (response.getBody() != null) {
                EnvioClickQuotationResponse ecResponse = objectMapper.readValue(
                        response.getBody(), EnvioClickQuotationResponse.class);

                if ("OK".equals(ecResponse.getStatus()) && ecResponse.getData() != null
                        && ecResponse.getData().getRates() != null) {

                    List<ShippingRateDTO> rates = new ArrayList<>();
                    for (int i = 0; i < ecResponse.getData().getRates().length; i++) {
                        EnvioClickQuotationResponse.QuotationData.Rate rate = ecResponse.getData().getRates()[i];

                        rates.add(ShippingRateDTO.builder()
                                .id("envioclick_" + rate.getIdCarrier() + "_" + rate.getIdProduct() + "_" + i)
                                .provider(rate.getCarrier() != null ? rate.getCarrier().toUpperCase() : "ENVIOCLICK")
                                .serviceName(rate.getProduct() != null ? rate.getProduct() : "EnvioClick")
                                .serviceCode(String.valueOf(rate.getIdRate()))
                                .estimatedDays(rate.getDeliveryDays() != null ? rate.getDeliveryDays() : 5)
                                .price(rate.getTotal() != null ? BigDecimal.valueOf(rate.getTotal()) : BigDecimal.ZERO)
                                .currency("MXN")
                                .build());
                    }

                    rates.sort((a, b) -> a.getPrice().compareTo(b.getPrice()));
                    log.info("EnvioClick found {} rates: {}", rates.size(),
                            rates.stream().map(r -> r.getProvider() + " $" + r.getPrice()).toList());
                    return rates;
                }
            }
        } catch (HttpClientErrorException e) {
            log.error("EnvioClick quotation API error: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error("Error parsing EnvioClick quotation response: {}", e.getMessage());
        }

        return Collections.emptyList();
    }

    public ShipmentResult createShipment(
            com.dazehaze.entity.Order order,
            String carrier,
            String serviceCode) {

        log.info("Creating EnvioClick shipment for order {} with rate ID {}", order.getOrderNumber(), serviceCode);

        com.dazehaze.entity.Address shippingAddr = order.getShippingAddress();
        String customerPhone = order.getGuestPhone() != null ? order.getGuestPhone() : "5500000000";
        String customerName = shippingAddr.getUser() != null
                ? shippingAddr.getUser().getFirstName() + " " + shippingAddr.getUser().getLastName()
                : "Cliente";

        List<CartItem> cartItems = order.getItems().stream()
                .map(orderItem -> {
                    CartItem cartItem = new CartItem();
                    cartItem.setProductVariant(orderItem.getProductVariant());
                    cartItem.setQuantity(orderItem.getQuantity());
                    return cartItem;
                })
                .collect(java.util.stream.Collectors.toList());

        com.dazehaze.dto.shipping.PackageInfo packageInfo = packageCalculator.calculatePackage(cartItems);

        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("idRate", Long.parseLong(serviceCode));
        requestBody.put("myShipmentReference", order.getOrderNumber());
        requestBody.put("requestPickup", false);
        requestBody.put("pickupDate", LocalDate.now().plusDays(1).format(DateTimeFormatter.ISO_DATE));
        requestBody.put("insurance", true);

        Map<String, Object> origin = new LinkedHashMap<>();
        origin.put("company", warehouseName);
        origin.put("rfc", "XAXX010101000");
        origin.put("firstName", warehouseName);
        origin.put("lastName", "");
        origin.put("email", "");
        origin.put("phone", warehousePhone);
        origin.put("street", warehouseStreet);
        origin.put("number", "");
        origin.put("suburb", "");
        origin.put("zipCode", warehousePostalCode);
        origin.put("reference", "");
        requestBody.put("origin", origin);

        Map<String, Object> destination = new LinkedHashMap<>();
        destination.put("company", "");
        destination.put("rfc", "XAXX010101000");
        String[] nameParts = customerName.split(" ", 2);
        destination.put("firstName", nameParts[0]);
        destination.put("lastName", nameParts.length > 1 ? nameParts[1] : "");
        destination.put("email", order.getGuestEmail() != null ? order.getGuestEmail() : "");
        destination.put("phone", customerPhone);
        destination.put("street", shippingAddr.getStreet());
        destination.put("number", "");
        destination.put("suburb", shippingAddr.getStreetLine2() != null ? shippingAddr.getStreetLine2() : "");
        destination.put("zipCode", shippingAddr.getPostalCode());
        destination.put("reference", "");
        requestBody.put("destination", destination);

        Map<String, Object> pkg = new LinkedHashMap<>();
        pkg.put("description", packageInfo.getContentDescription());
        pkg.put("contentValue", packageInfo.getDeclaredValue().doubleValue());
        pkg.put("weight", packageInfo.getTotalWeightKg());
        pkg.put("length", packageInfo.getLengthCm());
        pkg.put("height", packageInfo.getHeightCm());
        pkg.put("width", packageInfo.getWidthCm());
        requestBody.put("package", pkg);

        HttpHeaders headers = buildHeaders();
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            log.info("Calling EnvioClick shipment endpoint: {}", apiUrl + shipmentEndpoint);
            log.info("Shipment request: {}", objectMapper.writeValueAsString(requestBody));

            ResponseEntity<String> response = restTemplate.exchange(
                    apiUrl + shipmentEndpoint,
                    HttpMethod.POST,
                    entity,
                    String.class);

            log.info("EnvioClick shipment response: {}", response.getBody());

            if (response.getBody() != null) {
                EnvioClickShipmentResponse ecResponse = objectMapper.readValue(
                        response.getBody(), EnvioClickShipmentResponse.class);

                if ("OK".equals(ecResponse.getStatus()) && ecResponse.getData() != null) {
                    EnvioClickShipmentResponse.ShipmentData data = ecResponse.getData();
                    log.info("EnvioClick shipment created: orderId={}, tracking={}, label={}",
                            data.getIdOrder(), data.getTrackingNumber(), data.getLabel());

                    return ShipmentResult.builder()
                            .success(true)
                            .trackingNumber(data.getTrackingNumber())
                            .labelUrl(data.getLabel())
                            .shipmentId(data.getIdShipmentOrder())
                            .carrier(data.getCarrier())
                            .service(data.getProduct())
                            .build();
                } else {
                    throw new RuntimeException("EnvioClick shipment failed: " + response.getBody());
                }
            }
        } catch (HttpClientErrorException e) {
            log.error("EnvioClick shipment API error: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("EnvioClick API error: " + e.getResponseBodyAsString());
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error creating EnvioClick shipment: {}", e.getMessage(), e);
            throw new RuntimeException("Error creating shipment: " + e.getMessage());
        }

        return ShipmentResult.builder().success(false).errorMessage("Unknown error").build();
    }

    public TrackingResponse trackShipment(String trackingNumber, String carrier) {
        return trackShipmentByCodeAndCarrier(trackingNumber, extractCarrierId(carrier));
    }

    public TrackingResponse trackShipmentByCodeAndCarrier(String trackingCode, Long idCarrier) {
        log.info("Tracking EnvioClick shipment: code={}, carrierId={}", trackingCode, idCarrier);

        try {
            Map<String, Object> requestBody = new LinkedHashMap<>();
            requestBody.put("trackingCode", trackingCode);
            requestBody.put("idCarrier", idCarrier);

            HttpHeaders headers = buildHeaders();
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    apiUrl + trackEndpoint,
                    HttpMethod.POST,
                    entity,
                    String.class);

            if (response.getBody() != null) {
                return parseTrackResponse(response.getBody(), trackingCode, idCarrier);
            }
        } catch (HttpClientErrorException e) {
            log.error("EnvioClick track error: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error("Error tracking EnvioClick shipment: {}", e.getMessage());
        }

        return TrackingResponse.builder()
                .success(false)
                .trackingNumber(trackingCode)
                .errorMessage("Unable to get tracking information from EnvioClick")
                .build();
    }

    private TrackingResponse parseTrackResponse(String responseBody, String trackingNumber, Long carrierId) {
        try {
            EnvioClickTrackResponse ecResponse = objectMapper.readValue(responseBody, EnvioClickTrackResponse.class);

            if ("OK".equals(ecResponse.getStatus()) && ecResponse.getData() != null) {
                EnvioClickTrackResponse.TrackData data = ecResponse.getData();

                List<TrackingResponse.TrackingEvent> events = new ArrayList<>();
                if (data.getEvents() != null) {
                    for (EnvioClickTrackResponse.TrackEvent event : data.getEvents()) {
                        events.add(TrackingResponse.TrackingEvent.builder()
                                .status(event.getStatus())
                                .description(event.getDescription())
                                .location(event.getLocation())
                                .date(parseEventDate(event.getDate(), event.getHour()))
                                .build());
                    }
                }

                return TrackingResponse.builder()
                        .success(true)
                        .trackingNumber(data.getTrackingNumber())
                        .carrier(data.getCarrier() != null ? data.getCarrier() : String.valueOf(carrierId))
                        .currentStatus(data.getStatus())
                        .currentStatusDescription(data.getStatusDescription())
                        .events(events)
                        .lastUpdate(events.isEmpty() ? null : events.get(0).getDate())
                        .build();
            }

            return TrackingResponse.builder()
                    .success(false)
                    .trackingNumber(trackingNumber)
                    .errorMessage("No tracking data found")
                    .build();

        } catch (Exception e) {
            log.error("Error parsing EnvioClick track response: {}", e.getMessage());
            return TrackingResponse.builder()
                    .success(false)
                    .trackingNumber(trackingNumber)
                    .errorMessage("Error parsing tracking data")
                    .build();
        }
    }

    private LocalDateTime parseEventDate(String date, String hour) {
        if (date == null || date.isEmpty()) return null;
        try {
            if (hour != null && !hour.isEmpty()) {
                return LocalDateTime.parse(date + "T" + hour);
            }
            return LocalDate.parse(date, DateTimeFormatter.ISO_DATE).atStartOfDay();
        } catch (Exception e) {
            return null;
        }
    }

    public boolean cancelShipment(String trackingNumber, String carrier) {
        log.info("Cancelling EnvioClick shipment: {}", trackingNumber);

        try {
            Map<String, Object> requestBody = new LinkedHashMap<>();
            requestBody.put("idOrders", Collections.singletonList(Long.parseLong(trackingNumber)));

            HttpHeaders headers = buildHeaders();
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    apiUrl + cancelEndpoint,
                    HttpMethod.POST,
                    entity,
                    String.class);

            log.info("EnvioClick cancel response: {}", response.getBody());
            return "OK".equals(objectMapper.readTree(response.getBody()).get("status").asText());

        } catch (Exception e) {
            log.error("Error cancelling EnvioClick shipment: {}", e.getMessage());
            return false;
        }
    }

    private Long extractCarrierId(String carrier) {
        if (carrier == null || carrier.isEmpty()) return 0L;
        try {
            if (carrier.matches("\\d+")) return Long.parseLong(carrier);
            return carrier.hashCode() & 0xFFFFFFFFL;
        } catch (Exception e) {
            return 0L;
        }
    }

    private HttpHeaders buildHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", apiKey.trim());
        headers.set("User-Agent", "DazeHaze/1.0 (SpringBoot)");
        return headers;
    }

    public void discoverEndpoints() {
        log.info("EnvioClick API URL: {}", apiUrl);
        log.info("Quotation Endpoint: {}", apiUrl + quotationEndpoint);
        log.info("Shipment Endpoint: {}", apiUrl + shipmentEndpoint);
        log.info("Track Endpoint: {}", apiUrl + trackEndpoint);
        log.info("Cancel Endpoint: {}", apiUrl + cancelEndpoint);
        log.info("Warehouse: {}, {}, {} {}, {}", warehouseName, warehouseStreet, warehouseCity, warehouseState, warehousePostalCode);
        log.info("ENDPOINT DISCOVERY COMPLETE");
    }
}
