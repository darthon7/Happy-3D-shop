package com.dazehaze.dto.shipping.envioclick;

import lombok.Data;

@Data
public class EnvioClickTrackRequest {
    private String trackingCode;
    private Long idCarrier;
}
