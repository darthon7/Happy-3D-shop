package com.dazehaze.dto.shipping.envioclick;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class EnvioClickTrackResponse {

    private String status;

    @JsonProperty("status_codes")
    private Object statusCodes;

    @JsonProperty("status_messages")
    private Object statusMessages;

    @JsonProperty("data")
    private TrackData data;

    @Data
    public static class TrackData {
        private String trackingNumber;
        private Long idCarrier;
        private String carrier;
        private String status;
        private String statusDescription;
        private TrackEvent[] events;
    }

    @Data
    public static class TrackEvent {
        private String status;
        private String description;
        private String location;
        private String date;
        private String hour;
    }
}
