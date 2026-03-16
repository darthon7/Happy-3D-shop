package com.dazehaze.dto.shipping;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrackingResponse {

    private String trackingNumber;
    private String carrier;
    private String currentStatus;
    private String currentStatusDescription;
    private LocalDateTime estimatedDelivery;
    private LocalDateTime lastUpdate;
    private List<TrackingEvent> events;
    private boolean success;
    private String errorMessage;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrackingEvent {
        private String status;
        private String description;
        private LocalDateTime date;
        private String location;
    }
}
