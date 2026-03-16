package com.dazehaze.dto.admin;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateOrderStatusRequest {

    @NotNull(message = "Status is required")
    private OrderStatus status;

    private String trackingNumber;
    private String carrier;
    private String serviceName;
    private Integer estimatedDeliveryDays;
    private String notes;

    public enum OrderStatus {
        PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, RETURN_IN_PROGRESS, CANCELLED, REFUNDED
    }
}
