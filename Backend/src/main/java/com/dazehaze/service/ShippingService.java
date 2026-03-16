package com.dazehaze.service;

import org.springframework.stereotype.Service;
import java.math.BigDecimal;

@Service
public class ShippingService {

    private static final BigDecimal FLAT_SHIPPING_RATE = new BigDecimal("150.00");

    public BigDecimal calculateShippingCost(BigDecimal orderSubtotal) {
        // Enforce flat rate for all orders as per requirement
        return FLAT_SHIPPING_RATE;
    }
}
