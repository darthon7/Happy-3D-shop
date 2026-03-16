package com.dazehaze.dto.order;

import com.dazehaze.entity.Order;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CancelOrderRequest {

    @NotNull(message = "El motivo de cancelación es requerido")
    private Order.CancellationReason reason;

    private String details; // optional free text
}
