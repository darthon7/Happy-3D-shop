package com.dazehaze.entity;

/**
 * Tipos de notificaciones del sistema
 */
public enum NotificationType {
    // Cliente - Pedidos
    ORDER_CREATED,
    PAYMENT_CONFIRMED,
    ORDER_CONFIRMED,
    ORDER_PROCESSING,
    ORDER_SHIPPED,
    ORDER_IN_TRANSIT,
    ORDER_DELIVERED,
    ORDER_CANCELLED,
    ORDER_REFUNDED,

    // Cliente - Productos
    NEW_PRODUCT,
    PRODUCT_RESTOCKED,

    // Admin
    NEW_ORDER,
    PAYMENT_RECEIVED,
    LOW_STOCK,
    OUT_OF_STOCK,
    ORDER_CANCELLED_BY_USER
}
